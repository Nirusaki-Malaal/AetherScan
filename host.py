#!/usr/bin/env python3


import sys, json, os
import xmltodict
import subprocess

# Ensure binary I/O on Windows to prevent CRLF translation which corrupts Native Messaging length headers
if sys.platform == "win32":
    import msvcrt
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

# sending messages via stdin or stdout

def log(msg):
    print(msg, file=sys.stderr)

def read():
    raw_len = sys.stdin.buffer.read(4) 
    # b'\x12\x00\x00\x00' these are basically 4 bytes that represent the length of the message
    # sent by the firefox extenstion --> native host
    # this data \x represent hex values , so we got over here 4 hexes am i clear , 12, 0 , 0, 0 total of 4 bytes
    # convert this into decimal value using int.from_bytes() method and specify the byte order as 'little' (little-endian)
    # little-endian means that the least significant byte is stored first, so the bytes are read in reverse order to get 0x00000012 = 18
    # this represent that the code must read 18 bytes from stdin to get the complete message

    # this is the amount of bytes send my firefox to my local host
    if len(raw_len) < 4: # if raw_len is None so we exit the program
        sys.exit(0)
    msg_len = int.from_bytes(raw_len, 'little')
    data = sys.stdin.buffer.read(msg_len) ## read x bytes from stdin
    return json.loads(data.decode('utf-8')) # decode the data and load it as a json object (jaise bheja hai waisa hi receive karna hai)

def send(msg):
    encoded = json.dumps(msg).encode('utf-8')

    sys.stdout.buffer.write(len(encoded).to_bytes(4, 'little')) 
    sys.stdout.buffer.write(encoded) # write the encoded message to stdout
    sys.stdout.flush() # flush to the buffer memory to ensure that the message is sent immediately

def nmap(url: str):
    result = subprocess.run(['nmap', '-sV','-oX', '-', url], capture_output=True, text=True)
    #log(result.stdout)
    try:
        return xmltodict.parse(result.stdout)
    except:
        exit(1)
    

def format(raw, hostname):
    try:
        ipv4 = "Unknown"
        address = raw.get("nmaprun",{}).get("host",{}).get("address", {})
        if isinstance(address, list):
            for addr in address:
                if addr.get("@addrtype") == "ipv4":
                    ipv4 = addr.get("@addr")
                    break
        else:
            ipv4 = address.get("@addr")
    except:
        pass
    ## UPPER PORTION FIXED 
    ports_node = raw.get("nmaprun",{}).get("host",{}).get("ports") or {}
    ports = ports_node.get("port", []) if isinstance(ports_node, dict) else []
    formatted_ports = []
    if not isinstance(ports, list):
        ports = [ports]
    for open_port in ports:
        formatted_ports.append({"port_num":open_port.get("@portid", "Unknown"), "protocol": open_port.get("@protocol", "Unknown"), "service_name": open_port.get("service", {}).get("@name","Unknown"), "version": open_port.get("service", {}).get("@version","404")})
    return {"ipv4": ipv4, "hostname": hostname, "ports": formatted_ports}
    pass


print("HOST STARTED", file=sys.stderr) ## print to stderr so that it is visible in the console for debugging purposes

while True:
    msg = read()
    #print("Received:", msg, file=sys.stderr)
    # process message
    data = nmap(msg['target'])
    data = format(data, msg['target'])
    print("Nmap scan completed for:", msg['target'], file=sys.stderr)
    response = {"output": data}
    send(response)