var root =  new TreeNode(null, null, null,null, null);
const maxSpanSize = 64;

const StyleCodes = {
    'BOLD' : 0,
    'CURSIVE' : 1,
    'UNDERLINE' : 2,
    'STRIKETHROUGH' : 3,
    'FONT' : 4,
    'FONT_COLOUR' : 5,
    'FONT_SIZE' : 6,
    'LIST_ORDERED' : 7,
    'LIST_UNORDERED' : 8,
    'HEADER' : 9,
    'PARAGRAPH' : 10
}
var c;
var ctx;
function dataRopeTest() {
    c = document.getElementById("myCanvas");
    ctx = c.getContext("2d");

    insert('govno ', null, 0);
    insert('zhopa ', null, 0);
    insert('suka ', null, 0);

    insert('blya', null, 17);

    insert('after suka ', null, 5);
    insert('aaa ', null, 16);

    console.log(getFullString(root));
    console.log(getAffectedNode(root, 4));

    const t = new Tree()
    t.bfs()
}

function TreeNode(parent, left, right, text, style) {
    this.parent = parent;
    this.children = [left, right];
    this.text = text;
    this.length = text ? text.length : null;
    this.style = [];

    /////
    this.r = 20;

    this.position = { x: 0, y: 0 };

    /////

    this.style.concat(Array.isArray(style) ? style : style ? [style] : []);

    //functions
    this.getText = () => {
        return text;
    }
    this.getLength = () => {
        return this.length;
    }
    this.getLeft = () => {
        return this.children[0];
    }
    this.getRight = () => {
        return this.children[1];
    }

    this.setLeft = (left) => {
        this.children[0] = left;
        left.parent = this;
        this.length = left.length + (this.getRight() ? this.getRight().length : 0);
        if (this.parent) this.parent.updateLength();
    }
    this.setRight = (right) => {
        this.children[1] = right;
        right.parent = this;
        this.length = right.length + (this.getLeft() ? this.getLeft().length : 0);
        if (this.parent) this.parent.updateLength();
    }
    this.updateLength = () => {
        this.length = this.getLeft() ? this.getLeft().length : 0 + this.getRight() ? this.getRight().length : 0;
        if (this.parent) this.parent.updateLength();
    }
}

function insert(text, style, pos) {
    let newNode = new TreeNode(null, null, null, text, style);

    if (pos === 0 || pos === root.length){
        if (root.getLeft() || root.getRight() || root.getText())
            root = pos === 0 ? concat(newNode, root) : concat(root, newNode);
        else
            root = newNode;

        return root;
    }

    let toChange = getAffectedNode(root, pos);
    let affectedNode = toChange[0];
    let remainingPos = pos - toChange[1];

    let isLeft = affectedNode.parent.getLeft() === affectedNode;

    let modifiedUpperNode;
    if (remainingPos === 0) {
        if (isLeft) {
            if (affectedNode.parent.getRight() === null) {
                affectedNode.parent.setRight(affectedNode);
                affectedNode.parent.setLeft(newNode);
            } else {
                affectedNode.parent.setLeft(concat(newNode, affectedNode));
            }
        } else {
            if (affectedNode.parent.getLeft() === null) {
                affectedNode.parent.setLeft(newNode);
            } else {
                affectedNode.parent.setRight(concat(newNode, affectedNode));
            }
        }
    } else if (remainingPos === affectedNode.length) {
        if (isLeft) {
            if (affectedNode.parent.getRight() === null) {
                affectedNode.parent.setRight(newNode);
            } else {
                affectedNode.parent.setLeft(concat(affectedNode, newNode));
            }
        } else {
            if (affectedNode.parent.getLeft() === null) {
                affectedNode.parent.setLeft(affectedNode);
                affectedNode.parent.setRight(newNode);
            } else {
                affectedNode.parent.setRight(concat(affectedNode, newNode));
            }
        }
    } else {

    }
}

function concat(left, right) {
    let node = new TreeNode();
    node.setLeft(left);
    node.setRight(right);

    return node;
}

function getAffectedNode(start, pos) {
    let posChecked = 0;
    let node = start;
    while (true) {
        if (pos === 0 || pos === root.length || node.text)
            break;
        else if (node.getLeft() && (posChecked + node.getLeft().getLength()) >= pos) {
            node = node.getLeft();
        }
        else if (node.getRight() && (posChecked + node.getRight().getLength()) <= pos) {
            posChecked += node.getLeft().getLength();
            node = node.getRight();
        }
        else
            break;
    }
    return [node, posChecked];
}

function nextTextNode(start){
    let node = start;
    let parent = start.parent;

    while (parent){
        if (parent.getRight() === node || parent.getRight() === null){
            node = parent;
            parent = node.parent;
        }
        else
            break;
    }

    if (parent) {
        node = parent.getRight();
        while (node.text === null || node.getLeft()){
            node = parent.left;
        }
    }

    return node;
}

function getFullString(start){
    let c = start;
    let toCheck = [];
    while (c != null) {
        toCheck.push(c);
        c = c.getLeft();
    }

    let res = '';
    while (toCheck.length > 0) {
        let node = toCheck.pop();
        if (node.getText()) {
            res = res.concat(node.getText());
        } else {
            let right = node.getRight();
            if (right != null) {
                toCheck.push(right);
                let cleft = right.getLeft();
                while (cleft != null){
                    toCheck.push(cleft);
                    cleft = cleft.getLeft();
                }
            }
        }
    }
    return res;
}

class Tree{
    bfs() {
        const queue = []
        const black = "#000"
        queue.push(root)
        queue[0].position = {x: 800, y: 44};

        while (queue.length !== 0) {
            const node = queue.shift()
            const {x, y} = node.position
            const color = "#" + ((1 << 24) * Math.random() | 0).toString(16)

            ctx.beginPath()
            ctx.strokeStyle = black
            ctx.fillStyle = color
            ctx.fill()
            ctx.stroke()
            ctx.strokeStyle = black
            ctx.strokeText(node.text ? node.length + ', "' + node.text + '"' : node.length, x, y)

            if (node.getLeft()){
                node.getLeft().position = {x: x - 100, y: y + 100};
                const {x: x1, y: y1} = node.getLeft().position;
                ctx.beginPath();
                ctx.moveTo(x, y + 20)
                ctx.lineTo(x1 + 20, y1 - 20)
                ctx.stroke()
                queue.push(node.getLeft())
            }
            if (node.getRight()){
                node.getRight().position = {x: x + 100, y: y + 100};
                const {x: x1, y: y1} = node.getRight().position;
                ctx.beginPath();
                ctx.moveTo(x, y + 20)
                ctx.lineTo(x1 - 20, y1 - 20)
                ctx.stroke()
                queue.push(node.getRight())
            }
        }
    }
}
