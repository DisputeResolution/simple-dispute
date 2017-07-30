const assertLogs = (logs, eventListened, propertyName, expected, type, message) => {
    for (let i = 0; i < logs.length; i++) {
        let log = logs[i];

        if (log.event == eventListened) {
            switch(type) {
                case 'string':
                expectedValue = String(expected);
                break;
                case 'bool':
                expectedValue = Boolean(expected);
                break;
                default:
                expectedValue = Number(expected);
            }
            return assert(log.args[propertyName] === expectedValue, message);
        }
    }
};

module.exports = assertLogs;
