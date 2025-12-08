const dbus = require('../');
const Message = dbus.Message;

async function ping (bus) {
  return bus.call(new Message({
    destination: 'org.freedesktop.DBus',
    path: '/org/freedesktop/DBus',
    interface: 'org.freedesktop.DBus.Peer',
    member: 'Ping'
  }));
}

/**
 * Waits for a message that passes a filter on a provided bus.
 */
function waitForMessage(bus, messageFilter, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for message: ${JSON.stringify(messageFilter)}`));
    }, timeout);

    const handler = (message) => {
      const isMessageValid = Object.entries(messageFilter).every(
        ([key, value]) => message[key] === value
      );

      if (isMessageValid) {
        clearTimeout(timer);
        bus.removeListener('message', handler);
        resolve();
      }
    };

    bus.on('message', handler);
  });
}

module.exports = {
  ping,
  waitForMessage,
};
