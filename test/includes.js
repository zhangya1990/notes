const a = {

};
const b = [a];
b.push(NaN);
console.log(b.includes(a))
console.log(b.includes(NaN))