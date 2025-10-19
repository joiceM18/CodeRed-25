const actions = require('./actions');


async function routes(req, res) {
    const URL = req.url;
    const method = req.method;

    console.log(`Incoming request: ${method} ${URL}`);


    if (URL.startsWith('/getUsers') && method === 'GET') {
        return actions.getUsers(req, res);
    }

    if (URL.startsWith('/signup') && method === 'POST') {
        return actions.handleSignup(req, res);
    }

    if (URL.startsWith('/login') && method === 'POST') {
        return actions.handleLogin(req, res);
    }

    // Add textbook record
    if (URL.startsWith('/api/textbook/add') && method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body || '{}');
                const { textbook_input, textbook_output, subject, userID, is_public } = parsed;
                if (!textbook_input || !textbook_output || !subject || !userID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Missing required fields.' }));
                    return;
                }
                const id = await actions.addTextbook({ textbook_input, textbook_output, subject, userID, is_public });
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, textbookID: id }));
            } catch (err) {
                console.error('Error adding textbook:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: err.message || 'Failed to add textbook.' }));
            }
        });
        return;
    }


    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route Not Found" }));
};

module.exports = routes;