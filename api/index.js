const XRPFactory = require('../src/index.js');

module.exports = async (req, res) => {
    if (!global.factory) {
        global.factory = new XRPFactory();
        await global.factory.initialize();
    }
    
    res.status(200).json({
        status: 'active',
        message: '🚀 XRP Factory Running!'
    });
};
