export function parseHTML (html, options) {
    const stack = []
    const expectHTML = options.expectHTML
    const isUnaryTag = options.isUnaryTag || no
    const canBeLeftOpenTag = options.canBeLeftOpenTag || no
    let index = 0
    let last, lastTag
    while (html) {
        last = html
        // Make sure we're not in a plaintext content element like script/style
        if (!lastTag || !isPlainTextElement(lastTag)) {
            let textEnd = html.indexOf('<')
            if (textEnd === 0) {
                // 如果以注释开头，删掉注释部分继续解析
                if (comment.test(html)) {
                    const commentEnd = html.indexOf('-->')

                    if (commentEnd >= 0) {
                        advance(commentEnd + 3)
                        continue
                    }
                }

                //如果以条件注释开头，删掉条件注释部分继续解析
                // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
                if (conditionalComment.test(html)) {
                    const conditionalEnd = html.indexOf(']>')

                    if (conditionalEnd >= 0) {
                        advance(conditionalEnd + 2)
                        continue
                    }
                }

                //如果包含Doctype，删掉继续解析
                // Doctype:
                const doctypeMatch = html.match(doctype)
                if (doctypeMatch) {
                    advance(doctypeMatch[0].length)
                    continue
                }

                //如果是闭合标签开头，对标签做相应的处理，继续解析
                // End tag:
                const endTagMatch = html.match(endTag)
                if (endTagMatch) {
                    const curIndex = index
                    advance(endTagMatch[0].length)
                    parseEndTag(endTagMatch[1], curIndex, index)
                    continue
                }

                //如果以起始标签开头，解析起始标签,并添加到stack中，lastTag = tagName，如果options中包含start函数，执行
                // Start tag:
                const startTagMatch = parseStartTag()
                if (startTagMatch) {
                    handleStartTag(startTagMatch)
                    continue
                }
            }

            let text, rest, next
            if (textEnd >= 0) {
                rest = html.slice(textEnd)
                while (
                !endTag.test(rest) &&
                !startTagOpen.test(rest) &&
                !comment.test(rest) &&
                !conditionalComment.test(rest)
                    ) {
                    // < in plain text, be forgiving and treat it as text
                    next = rest.indexOf('<', 1)
                    if (next < 0) break
                    textEnd += next
                    rest = html.slice(textEnd)
                }
                text = html.substring(0, textEnd)
                advance(textEnd)
            }

            if (textEnd < 0) {
                text = html
                html = ''
            }

            if (options.chars && text) {
                options.chars(text)
            }
        } else {
            var stackedTag = lastTag.toLowerCase()
            var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
            var endTagLength = 0
            var rest = html.replace(reStackedTag, function (all, text, endTag) {
                endTagLength = endTag.length
                if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                    text = text
                        .replace(/<!--([\s\S]*?)-->/g, '$1')
                        .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
                }
                if (options.chars) {
                    options.chars(text)
                }
                return ''
            })
            index += html.length - rest.length
            html = rest
            parseEndTag(stackedTag, index - endTagLength, index)
        }

        if (html === last) {
            options.chars && options.chars(html)
            if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
                options.warn(`Mal-formatted tag at end of template: "${html}"`)
            }
            break
        }
    }

    // Clean up any remaining tags
    parseEndTag()

    function advance (n) {
        index += n
        html = html.substring(n)
    }

    function parseStartTag () {
        const start = html.match(startTagOpen)
        if (start) {
            const match = {
                tagName: start[1],
                attrs: [],
                start: index
            }
            advance(start[0].length)
            let end, attr
            //对起始标签进行处理，返回一个match对象，{tagName：string,attrs:[所有属性,包括v-bind:xxx等],start：标签起始索引,end：标签结束索引，unarySlash：\|''}
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length)
                match.attrs.push(attr)
            }
            if (end) {
                match.unarySlash = end[1]
                advance(end[0].length)
                match.end = index
                return match
            }
        }
    }

    function handleStartTag (match) {
        const tagName = match.tagName
        const unarySlash = match.unarySlash

        if (expectHTML) {
            if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
                parseEndTag(lastTag)
            }
            if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
                parseEndTag(tagName)
            }
        }

        //isUnaryTag
        //makeMap('area,base,br,col,embed,frame,hr,img,input,isindex,keygen,'link,meta,param,source,track,wbr',true);
        //unary 不是自闭和标签，并且标签名不是html，并且上一次解析的标签不是head标签
        //unarySlash的值为\|'',!!unarySlash为\，说明为自动闭合标签，unary值为true
        const unary = isUnaryTag(tagName) || tagName === 'html' && lastTag === 'head' || !!unarySlash

        const l = match.attrs.length
        const attrs = new Array(l)
        //解析match.attrs，将数组的每个值解析为对象{name:'属性名包括id,v-bind:class,@click等',value:'值'}
        for (let i = 0; i < l; i++) {
            const args = match.attrs[i]
            // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
            if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
                if (args[3] === '') { delete args[3] }
                if (args[4] === '') { delete args[4] }
                if (args[5] === '') { delete args[5] }
            }
            const value = args[3] || args[4] || args[5] || ''
            attrs[i] = {
                name: args[1],
                value: decodeAttr(
                    value,
                    options.shouldDecodeNewlines
                )
            }
        }

        //不是一元标签，将当前解析结果添加进栈，lastTag设置为当前解析的标签
        if (!unary) {
            stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs })
            lastTag = tagName
        }

        if (options.start) {
            options.start(tagName, attrs, unary, match.start, match.end)
        }
    }

    function parseEndTag (tagName, start, end) {
        let pos, lowerCasedTagName
        if (start == null) start = index
        if (end == null) end = index

        if (tagName) {
            lowerCasedTagName = tagName.toLowerCase()
        }

        // Find the closest opened tag of the same type
        //找到最近的起始标签
        if (tagName) {
            for (pos = stack.length - 1; pos >= 0; pos--) {
                if (stack[pos].lowerCasedTag === lowerCasedTagName) {
                    break
                }
            }
        } else {
            // If no tag name is provided, clean shop
            pos = 0
        }

        if (pos >= 0) {
            // Close all the open elements, up the stack
            for (let i = stack.length - 1; i >= pos; i--) {
                if (process.env.NODE_ENV !== 'production' &&
                    (i > pos || !tagName) &&
                    options.warn) {
                    options.warn(
                        `tag <${stack[i].tag}> has no matching end tag.`
                    )
                }
                if (options.end) {
                    options.end(stack[i].tag, start, end)
                }
            }

            // Remove the open elements from the stack
            stack.length = pos
            lastTag = pos && stack[pos - 1].tag
        } else if (lowerCasedTagName === 'br') {
            if (options.start) {
                options.start(tagName, [], true, start, end)
            }
        } else if (lowerCasedTagName === 'p') {
            if (options.start) {
                options.start(tagName, [], false, start, end)
            }
            if (options.end) {
                options.end(tagName, start, end)
            }
        }
    }
}