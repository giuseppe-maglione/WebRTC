from SmartCardReader import SmartCardReader

BLOCK = 4
KEY_A = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
KEY_SLOT = 0
CARDS = ['CARD-GIU-001', 'CARD-NARI-001']
data_to_write = CARDS[0].encode("utf-8").ljust(16, b"\x00")

if __name__ == "__main__":
    try:
        with SmartCardReader(key_a=KEY_A, key_slot=KEY_SLOT) as reader:     # 'with' ensure disconnection
            
            # --- WRITE DATA ---
            print(f"\n--- START WRITING BLOCK {BLOCK} ---")
            if reader.write_block(BLOCK, data_to_write):
                print("[STATUS] writing data (16 bytes):", data_to_write.rstrip(b'\x00').decode(errors="ignore"))
                print("[STATUS] writing completed successfully.")
            else:
                print("[ERROR] writing failed!")

            # --- READ AND VERIFY DATA ---
            print(f"\n--- START READING BLOCK {BLOCK} ---")
            read_data = reader.read_block(BLOCK)

            if read_data:
                print("[STATUS] read data:", read_data)
                try:
                    readable_text = read_data.rstrip(b'\x00').decode(errors="ignore")
                    print("[STATUS] ASCII:", readable_text)
                except:
                    print("[WARNING] could not decode read data.")
            else:
                print("[ERROR] reading failed!")
                
    except Exception as e:
        print(f"\nGLOBAL EXCEPTION: {e}")