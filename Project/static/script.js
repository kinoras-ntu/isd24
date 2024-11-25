const SERVER = 'http://127.0.0.1:5000';

const canvas = document.getElementById('my-canvas');
const ctx = canvas.getContext('2d');

let mode = 'select';    // Modes: idle, select or draw
let isDrawing = false;

const objects = [];
const currObject = { nodeId: -1, lines: [], ref: { x: 0, y: 0 } };


/* Controls */

document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
        if (event.target.checked) {
            mode = event.target.value;
            console.log(`Mode changed: ${mode}`)
        }
    });
});

document.getElementById('save').addEventListener('click', () => {
    console.log({ ...currObject });
    if (currObject.lines.length > 0) {
        objects.push({ ...currObject });
        currObject.lines = [];
        console.log('Saved!');
    }
});


/* MediaPipe Nodes */

const nodePositions = []

const getNodePositions = async () => {
    try {
        const response = await fetch(`${SERVER}/nodes`);
        if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        nodePositions.length = 0;
        data.nodes.forEach(node => nodePositions.push(node));

        return nodePositions;
    } catch (err) {
        console.error('Error fetching node positions:', err);
    }
};

const getNearestNode = (x, y) => {
    let index = -1;
    let minDistance = Infinity;

    nodePositions.forEach(node => {
        const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
        if (distance < minDistance) {
            minDistance = distance;
            index = node.id;
        }
    });

    return index;
}


/* Logic */

const drawObjects = async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await getNodePositions();

    // Draw saved objects
    objects.forEach((obj) => {
        const pos = nodePositions.find(({ id }) => id === obj.nodeId);
        if (pos) {
            obj.lines.forEach((line) => {
                const offsetX = pos.x - obj.ref.x;
                const offsetY = pos.y - obj.ref.y;
                ctx.beginPath();
                ctx.moveTo(line[0].x + offsetX, line[0].y + offsetY);
                for (let i = 1; i < line.length; i++) {
                    ctx.lineTo(line[i].x + offsetX, line[i].y + offsetY);
                }
                ctx.strokeStyle = 'white';
                ctx.stroke();

                console.log(line[0].x + offsetX, line[0].y + offsetY)
            });
        }
    });

    // Draw the current object
    currObject.lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (let i = 1; i < line.length; i++) {
            ctx.lineTo(line[i].x, line[i].y);
        }
        ctx.strokeStyle = 'red';
        ctx.stroke();
    });
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    switch (mode) {
        case 'select':
            const nodeId = getNearestNode(x, y);
            const node = nodePositions.find(node => node.id == nodeId);
            currObject.nodeId = nodeId;
            currObject.ref = { x: node.x, y: node.y }
            console.log(`Selected point (${x}, ${y}) with random number: ${nodeId}`);
            break;
        case 'draw':
            isDrawing = true;
            currObject.lines.push([{ x, y }]);
            break;
        default:
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    switch (mode) {
        case 'draw':
            if (isDrawing) {
                const currLine = currObject.lines[currObject.lines.length - 1];
                currLine.push({ x, y });
            }
            break;
        default:
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});


document.addEventListener('DOMContentLoaded', () => {
    setInterval(() => {
        drawObjects();
    }, 1000/30);
})