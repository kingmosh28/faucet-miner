const CommandCenter = require('../src/command.js');

module.exports = async (req, res) => {
    if (!global.commandCenter) {
        global.commandCenter = new CommandCenter();
        await global.commandCenter.initialize();
    }
    
    res.status(200).json({ status: 'active', message: 'XRP Miner Online' });
};
