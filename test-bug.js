const http = require('http');

const data = JSON.stringify({
    title: "Test Bug from Node",
    description: "This is a test bug created via a script to verify the backend API.",
    projectId: "proj-123",
    reporterId: "user-123",
    reporterName: "Test User",
    severity: "high",
    status: "new"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/bugs',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
