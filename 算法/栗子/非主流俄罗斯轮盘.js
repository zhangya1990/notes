// 使用循环链表实现
class List{
    constructor(){
        this.head = null;
        this.length = 0;
        this.current = null;
    }
    forward(n){
        var i = 0;
        while(i!=n){
            i++;
            this.current = this.current.next;
        }
    }
    append(node){
        if(!this.head){
            this.current = this.head = node
            this.current.prev = this.current.next = node;
        }else{
            this.current.next = node;
            node.prev = this.current;
            node.next = this.head;
            this.head.prev = node;
            this.current = node;
        }
        this.length++;
    }
    remove(){
        var prev = this.current.prev;
        var next = this.current.next;
        prev.next = next;
        next.prev = prev;
        if(this.current == this.head){
            this.head = next;
        }
        this.current = next;
        this.length--;
    }
    showNode(){
        var arr = [];
        
        var head = this.head;
        arr.push(head);
        if(this.length == 1){
            return arr
        }
        do{
            head = head.next;
            var obj = {};
            for(var key in head){
                if(head.hasOwnProperty(key) && key !== 'next' && key !== 'prev'){
                    obj[key] = head[key]
                }
            }
            arr.push(obj);
        }while(head.next !== this.head)
        return arr
    }
}

// 总数为 total 的人 没数 step 个数干掉一个，最后剩余 suivive 个
function Russian_roulette (total,step,survive){
    var list = new List();
    for(var i = 0;i<total;i++){
        list.append({
            initialPosition:i+1
        })
    }
    while(list.length != survive){
        list.forward(step);
        list.remove();
    }
    return list.showNode();
}


console.log(Russian_roulette(40,3,3))