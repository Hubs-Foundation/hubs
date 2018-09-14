export function ringbuffer() {
  return {
    buffer: [],
    length: 20,
    writeHead: 0,
    write(frame) {
      const { buffer, writeHead, length } = this;
      buffer[writeHead] = frame;
      this.writeHead = (writeHead + 1) % length;
    },
    read(index) {
      const { buffer, writeHead, length } = this;
      return buffer[(length + writeHead - (index + 1)) % length];
    }
  };
}
