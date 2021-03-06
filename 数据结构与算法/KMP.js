// KMP 算法
// 是一种改进的字符串匹配算法，算法的关键是先计算出模式串的内部匹配信息,利用匹配失败后的信息，尽量最大的移动模式串,减少模式串与主串的匹配次数以达到快速匹配的目的。具体实现就是实现一个next()函数，函数本身包含了模式串的局部匹配信息。时间复杂度O(m+n)。

// 计算next数组

function cal_next(str) {
    let len = str.length;
    let next = [];//next[0]初始化为-1
    let k = -1;//k初始化为-1,k值表示，当字符串当前的索引为q时，从str[0]到str[q]中存在最长的相同前缀和后缀时，前缀当中最后一个字符的索引（如 abcab 中，当q等于3时，最长相同前后缀为 a ，k为0，当q等于4时，最长相同前后缀为 ab，k为1），当不存在相同前后缀时，k为-1
    next[0] = -1;// 字符串首位k值为-1
    for (let q = 1; q <= len - 1; q++) {
        while (k > -1 && str[k + 1] != str[q]) {
            // 首先理解 next[n]的值为当索引为n时求得的k值，及索引为n并且存在的相同前后缀时，前缀的最后一个字符的索引。

            // 如果 str[k + 1] != str[q] ，说明索引为 q 时，前后缀不再相同，因为 k 不为 -1 时，说明索引为 q -1 时存在相同的前后缀，那么可以从当前的前缀向前回溯，当索引为 q-1 时，存在的前缀的最后一个字符的索引为 k ，那么 next[k] 值，即为 str[0] ... str[k] 中存在的最长的相同前后缀的前缀最后一个字符的索引（这里的相同前后缀，指的是 q-1 时，获取到的前缀中存在的相同前后缀，有点绕），从当前获取到的值向后一位进行比较，如果还不相同，继续当前的操作，向前回溯..

            // abacabad
            // 举个栗子,当q为6时，获取相同前后缀为aba，k为2，当q为7时，比较str[3] 和 str[7]，并不相同(c !== d)，因为abac和abad中，都存在aba，及k=6时的相同前后缀，分析可知，如果q为7时存在相同的前后缀，那么这个相同的串必定存在于q为6时所得的最长前缀当中，那么就可以从前缀(aba)中开始查找，获取aba中最长相同前后缀的字符索引，即 k = next[2],k = 0，向后一位进行比较 str[1] 值为 b， str[q]值为d，仍然不相同，继续向前 ... 最终得到没有相同的前后缀，k值为-1

            k = next[k];//往前回溯
        }
        // 如果当前的k值不为-1，说明当索引为q-1时，存在相同的前后缀，并且前缀最后一个字符索引为k，如果 str[k+1] === str[q],说明索引为q时前后缀依然相同，则 k+1
        if (str[k + 1] == str[q])//如果相同，k++
        {
            k = k + 1;
        }
        next[q] = k;//赋给next[q]
    }
    return next
}

var atr = 'abcabcabd';
cal_next(atr);


function kmp(str, ptr) {
    let next = cal_next(ptr);//计算next数组
    let k = -1;
    let total = str.length;
    let childLen = ptr.length;
    for (let i = 0; i < total; i++) {
        while (k > -1 && ptr[k + 1] != str[i]) {
            //ptr和str不匹配，且k>-1（表示ptr和str有部分匹配）
            k = next[k];//往前回溯
        }
        if (ptr[k + 1] == str[i]) {
            k = k + 1;
        }

        if (k == childLen - 1) {
            //说明k移动到ptr的最末端
            //cout << "在位置" << i-plen+1<< endl;
            //k = -1;//重新初始化，寻找下一个
            //i = i - plen + 1;//i定位到该位置，外层for循环i++可以继续找下一个（这里默认存在两个匹配字符串可以部分重叠），感谢评论中同学指出错误。
            return i - childLen + 1;//返回相应的位置
        }
    }
    return -1;
}