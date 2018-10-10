class LinkList{
    constructor(){
        this.head = this.tail = new LinkNode('head')
        this.setModified();
        this.lastStaticTime = this.lastModified;
        this.length = 1;
    }
    setModified(){
        this.lastModified = Date.now();
    }
    push(value){
        const currentNode = new LinkNode(value)
        if(this.head = null){   
            this.head = this.tail = currentNode
        }else{
            this.tail.next = currentNode;
        }
        this.setModified();
    }
    pop(){
        let temp = this.head;
        if(temp == null){
            return
        }
        if(temp.next == null){
            this.head = this.tail = null;
            return 
        }
        while(temp.next.next !== null){
            temp = temp.next;
        }
        temp.next = null;
        this.tail = temp;
        this.setModified();
    }
    delete(node){
        let temp = this.head;
        let prev = this.head;
        while(temp && temp.element && temp.element !== node){
            prev = temp;
            temp = temp.next;
        }
        if(prev !== temp && temp.element == node){
            prev.next = temp.next;
            this.setModified();
            if(prev.next == null){
                this.tail = prev;
            }
        }else{
            if(this.head.element == node){
                this.head = this.tail = null;
                this.setModified();
            }
        } 
    }
    deleteByCount(count){
        const length = this.getLength();
        if(length < count){
            return
        }
        let temp = this.head;
        let prev = this.head;
        let pos = 0;
        while(temp){
            pos++;
            prev = temp;
            temp = temp.next;
            if(pos == count){
                if(temp){
                    prev.next = temp.next;
                }else{
                    prev.next = null;
                }
                return
            }
        }
    }
    add(nodeVal,curVal){
        const cur = this.findeByValue(curVal);
        const node = new LinkNode(nodeVal);
        if(cur !== -1){
            node.next = cur.next;
            cur.next = node;
            this.setModified();
        }
    }
    findMiddle(){
        if(this.head == null){
            return -1
        }
        let slow = this.head;
        let fast = this.head;
        while(fast && fast.next && fast.next.next){
            fast = fast.next.next;
            slow = slow.next;
        }
        return slow
    }
    reverse(){
        let current = this.head;
        let next = null;
        let root = {
            element:'head',
            next:null
        };
        while(current){
            next = current.next;
            current.next = root.next
            root.next = current;
            current = next;
        }
        this.head = root.next;
    }
    findCircle(){
        if(!this.head || !this.head.next || !this.head.next.next){
            return -1
        }
        let fast = this.head;
        let slow = this.head;
        while(fast !== null && fast.next !== null){
            fast = fast.next.next;
            slow = slow.next;
            if(fast == slow){
                return fast
            }
        }
        return -1
    }
    deleteByCountOfReverse(n){
        this.reverse();
        this.deleteByCount(n);
        this.reverse();
    }
    findeByValue(value){
        let temp = this.head;
        while(temp !== null && temp.element !== value){
            temp = temp.next;
        }
        return temp !== null ? temp : -1
    }
    findByIndex(index){
        let temp = this.head;
        let pos = 0;
        while(temp !== null && pos !== index){
            temp = temp.next;
            pos++;
        }
        return temp !== null ? temp : -1
    }
    getLength(){
        if(this.lastStaticTime == this.lastModified && this.length){
            return
        }
        let count = 0;
        let temp = this.head;
        while(temp!==null){
            count++;
            temp = temp.next;      
        }
        this.length = count;
        this.lastStaticTime = this.lastModified;
    }
}

class LinkNode{
    constructor(value){
        this.element = value;
        this.next = null;
    }
}

function mergeByOrder(linka,linkb,sortRule=(a,b)=>a>=b){
    if(!linkb){
        return linka
    }
    if(!linka){
        return linkb
    }
    let result;

    while(linka && linkb){
        if(sortRule(linka,linkb)){
            if(!result){
                result = linka
            }else{
                result.push(linka)
            }
            linka = linka.next;
        }else{
            if(!result){
                result = linkb
            }else{
                result.push(linkb)
            }
            linkb = linkb.next;
        }
    }
    if(linka){
        result.push(linka)
    }
    if(linkb){
        result.push(linkb)
    }
    return result
}