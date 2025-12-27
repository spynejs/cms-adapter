// utils/findAvailablePort.js
const net = require('net');

/**
 * Check if a specific port is available.
 * @param {number} port - The port number to test.
 * @returns {Promise<boolean>} - Resolves true if available, false otherwise.
 */
const isPortAvailable = async (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer()
    .once('error', () => resolve(false))
    .once('listening', () => {
      tester.once('close', () => resolve(true)).close();
    })
    .listen(port);
  });
}

/**
 * Finds the next available port starting from a given number.
 * @param {number} [startingPortNum=3010] - Starting port number.
 * @param {number} [portAttempts=10] - Number of ports to test sequentially.
 * @returns {Promise<number>} - The first available port.
 * @throws {Error} - If no available port is found in the range.
 */
const findAvailablePort = async (startingPortNum = 8223, portAttempts = 10) => {
  const ports = Array.from({ length: portAttempts }, (_, i) => startingPortNum + i);

  for (const port of ports) {
    const available = await isPortAvailable(port);
    if (available) return port;
  }

  throw new Error(`No available ports found in range ${startingPortNum}–${startingPortNum + portAttempts - 1}`);
}

module.exports = {findAvailablePort};
