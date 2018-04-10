export class ServiceCollection {

    constructor(...entries) {
        this._entries = new Map()
        for (let [id, service] of entries) {
            this.set(id, service);
        }
    }

    set(id, instanceOrDescriptor,append){
        const result = this._entries.get(id);
        if(append){
            Array.isArray(result) ? this._entries.set(id, result.push(instanceOrDescriptor)) : this._entries.set(id, [result].push(instanceOrDescriptor));
        }else{
            this._entries.set(id, instanceOrDescriptor);
        }
        return this
    }

    forEach(callback) {
        this._entries.forEach((value, key) => callback(key, value));
    }

    has(id,val) {
        if(val){
            let res = this.get(id);
            if(res && res === val || (Array.isArray(res) && res.includes(val))){
                return true
            }
            return false
        }else{
            return this._entries.has(id);
        }
    }

    get(id) {
        return this._entries.get(id);
    }
    remove(id,val){
        if(val){
            let res = this.get(id);
            if(res === val){
                this._entries.delete(id);
            }else{
                if(Array.isArray(val) && res.indexOf(val) > -1){
                    this.set(id,res.filter(item=>item!==val))
                }
            }
        }else{
            this._entries.delete(id);
        }
        return this
    }
}
