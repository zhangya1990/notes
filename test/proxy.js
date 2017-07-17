function getName(){
    return console.log('haha')
}
getName = new Proxy(getName,{
    apply(){
        return console.log('lala')
    }
});
getName()