var config = {
    container: "#tree-simple"
};
var simple_chart_config = [
    config
];
var my_chart;
var root;
function generateTree() {
    root = window.opener.ropeRoot;
    const t = new Tree()
    t.bfs()
    my_chart = new Treant(simple_chart_config, null);
}

class Tree{
    bfs() {
        let map = new Map();
        const queue = []
        const black = "#000"
        queue.push(root)
        queue[0].position = {x: 800, y: 44};

        while (queue.length !== 0) {
            const node = queue.shift()
            let treantNode = {}
            let transformed = node.text ? JSON.stringify(node.text) : node.text;
            if (transformed === '"\\u000b"') transformed = '"\\v"';
            treantNode["text"] = {
                name : transformed ? node.length + ', ' + transformed : node.length
            }
            if (node.parent)
                treantNode["parent"] = map.get(node.parent);
            map.set(node, treantNode);
            simple_chart_config.push(treantNode);

            if (node.getLeft()){
                queue.push(node.getLeft())
            }
            if (node.getRight()){
                queue.push(node.getRight())
            }
        }
    }
}