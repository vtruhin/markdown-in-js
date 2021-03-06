import * as babylon from 'babylon'

import commonmark from 'commonmark'
import JSXRenderer from './jsx'
let reader = new commonmark.Parser()
let writer = new JSXRenderer()

module.exports = {
  visitor: {
    TaggedTemplateExpression(path) {
      
      let code = path.hub.file.code 
      if(path.node.tag.name === 'markdown') {
        let stubs = path.node.quasi.expressions.map(x => code.substring(x.start, x.end))          
        let stubCtx = stubs.reduce((o, stub, i) => (o['spur-' + i] = stub, o), {})
        let ctr = 0
        let strs = path.node.quasi.quasis.map(x => x.value.cooked)
        let src = strs.reduce((arr, str, i) => {
          arr.push(str)
          if(i !== stubs.length) {
            arr.push('spur-'+ctr++)
          }
          return arr
        }, []).join('')
        let parsed = reader.parse(src)
        let intermediateSrc = writer.render(parsed)
        // replace with stubs 
        let regex = /spur\-[0-9]+/gm
        let newSrc = intermediateSrc.replace(regex, x => `{${stubCtx[x]}}`)
        let transformed = babylon.parse(`<div className='_markdown_'>${newSrc}</div>`, { plugins: [
          'jsx', 'flow', 'doExpressions', 'objectRestSpread', 'decorators', 'classProperties',
          'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport' ]
        })
        path.replaceWith(transformed.program.body[0])
      }
    }    
  }
}

