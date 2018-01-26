'use strict'
const express = require('express')
const TreeModel = require('tree-model')
const httpStatus = require('http-status')


const app = express();

const tree = new TreeModel()
const root = tree.parse({
    key : "newProfile",
    children : [{
      key: "id",
    },{
      key: "name",
      children: [{
        key: "first",
      },{
        key: "middle"
      },{
        key: "last"
      }]
    },{
      key: "dob"
    },{
      key: "location",
      children: [{
        key: "coords",
        children:[{
          key: "long"
        },{
          key: "lat"
        }]
      }]
    },{
      key: "imageId"
    }]
  })


app.listen(3000);
console.log('Express app started on port ' + 3000)
app.post('/users/:userData', function (req, res) {
  const json = jsonParser(req.params.userData)
  res.status(httpStatus.OK).json(json).end()
})



function jsonParser(data) {
  const finalTree = new TreeModel()
  let rootNode = {}

  data.split('|').map(jsonValue => {
    if (jsonValue == "new_profile") {
      rootNode = finalTree.parse({value: "newProfile"})
    } else {
      if (jsonValue.indexOf('<') == -1) {
        const child = finalTree.parse({value: jsonValue})
        rootNode.addChild(child)
      } else if (jsonValue.indexOf(">>") != -1) {
        const j = jsonValue.split('<<').map(_jsonValue => {
          if (_jsonValue.indexOf('>>') == -1)
            return _jsonValue.replace(/</g, '').replace(/>/g, '')
          else
            return _jsonValue.replace(/></g, ' ').replace(/</g, '').replace(/>/g, '').split([' '])
        })
        const children = finalTree.parse({
          value: j[0],
          type: "array",
          children: [{value: null, type: "array", children: j[1].map(_jsonValue => ({value: _jsonValue}))}]
        })
        rootNode.addChild(children)

      }
      else {
        const jsonValues = jsonValue.replace(/></g, ' ').replace(/</g, '').replace(/>/g, '').split([' '])
        const children = finalTree.parse({
          value: null,
          type: "array",
          children: jsonValues.map(_jsonValue => ({value: _jsonValue}))
        })
        rootNode.addChild(children)

      }

    }
  })
  const json = {}
  constructJson(root.model.children, rootNode.model.children)
  function constructJson(keyNode, valueNode) {

    if (keyNode == null) return false
    if (!Array.isArray(keyNode)) {
      return valueNode.value
    }

    return keyNode.map((key, index) => {
      if (Array.isArray(key.children)) {
        let newJson = {}
        key.children.map((keyChild, indexChild) => {

          if (keyChild.children) {
            newJson[keyChild.key] = valueNode[index].children[indexChild].value
            return keyChild.children.map((_keyChild, _indexChild) => {
              newJson[_keyChild.key] = valueNode[index].children[indexChild].children[_indexChild].value
            })
          } else {
            newJson[keyChild.key] = valueNode[index].children[indexChild].value
          }

        })
        json[key.key] = newJson
      } else {
        json[key.key] = valueNode[index].value
      }
    })
  }
  return json
}