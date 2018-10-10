// 普通队列
class Queue{
    constructor(n){
        this.list = new Array(n);
        this.length = n;
        this.head = this.tail = 0;
    }
    enQueue(val){
        // 入队时如果队列前面还有剩余的空位，整体向前移动
        if(this.tail == this.length && this.head !== 0){
            for(let i = this.head;i<this.tail;i++){
                this.list[i-this.head] = this.list[i];
            }
            this.tail -= this.head;
            this.head = 0;
        }
        if(this.tail < this.length){
            this.list[this.tail++] = val;
        }
    }
    deQueue(){
        if(this.head < this.tail){
            this.head++
        }
    }
    showQueue(){
        for(let i = this.head;i<this.tail;i++){
            console.log(this.list[i])
        }
    }
    isEmpty(){
        return this.head == this.tail
    }
    isFull(){
        return this.head == 0 && this.tail == this.length
    }
}

//循环队列
class CircleQueue{
    constructor(n){
        this.list = new Array(n);
        this.length = n;
        this.head = this.tail = 0;
    }
    enQueue(val){
        if((this.tail + 1)%this.length !== this.head){
            this.list[this.tail] = val;
            this.tail = (this.tail+1)%this.length;
            return true
        }
        return false
    }
    deQueue(){
        if(this.head !== this.tail){
            const ret = this.list[this.head];
            this.head = (this.head+1)%this.length;
            return ret
        }
        return null
    }
    isEmpty(){
        return this.head == this.tail
    }
    isFull(){
        return (this.tail+1)%this.length == this.head
    }
    showQueue(){
        let temp = this.head;
        while(temp !== this.tail){
            console.log(this.list[temp]);
            temp = (temp+1)%this.length
        }
    }
}

// let a = new Queue(3);
// a.enQueue(1);
// a.enQueue(2);
// a.enQueue(3);
// a.showQueue()

// a.deQueue();
// a.enQueue(4);
// a.showQueue()

let a = new CircleQueue(5);
a.enQueue(1);
a.enQueue(2);
a.enQueue(3);
a.showQueue()

a.deQueue();
a.enQueue(4);
a.enQueue(5);
a.deQueue();
a.enQueue(6);
a.showQueue()
console.log(a)