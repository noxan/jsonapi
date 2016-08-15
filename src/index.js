import camelCaseToDashed from './camel-case-to-dashed';


export default class Schema {
  constructor(definition) {
    if (definition === undefined) {
      throw new Error('You have to provide a schema definition as parameter.');
    }
    this.definition = {
      id: definition.id || 'id',
      type: definition.type,
      attributes: definition.attributes || {},
      relationships: definition.relationships || {},
    };
  }

  resolveIdField(definition, obj, parentObj) {
    if (typeof definition.id === 'function') {
      return definition.id(obj, parentObj);
    } else {
      return obj[definition.id];
    }
  }

  serializeObj(obj) {
    const attributes = {};

    Object.keys(this.definition.attributes).forEach(targetKey => {
      const source = this.definition.attributes[targetKey];
      const target = camelCaseToDashed(targetKey);

      if (typeof source === 'function') {
        attributes[target] = source(obj);
      } else {
        attributes[target] = obj[source];
      }
    });

    const id = this.resolveIdField(this.definition, obj);

    // relationships
    const relationships = {};
    Object.keys(this.definition.relationships).forEach(key => {
      const relationship = this.definition.relationships[key];
      // TODO: support for definitions in relationships
      // const relationshipDefinition = this.definition.relationships[key];
      const data = obj[key].map(data => this.serializeRelationship(relationship, data, obj));
      if (data.length === 1) {
        relationships[key] = { data: data[0] };
      } else {
        relationships[key] = { data };
      }
    });

    const result = {
      type: this.definition.type,
      id: id,
      attributes: attributes,
    };

    // do not serialize empty object
    if (relationships && Object.keys(relationships).length > 0) {
      result.relationships = relationships;
    }

    return result;
  }

  serializeRelationship(relationship, relatedData, obj) {
    return {
      type: relationship.type,
      id: this.resolveIdField(relationship, relatedData, obj),
    };
  }

  serialize(objectOrArray) {
    const data = [];

    if (objectOrArray.length === undefined) {
      data.push(this.serializeObj(objectOrArray));
    } else {
      objectOrArray.forEach(obj => {
        data.push(this.serializeObj(obj));
      });
    }

    return {
      links: {},
      data: data.length === 1 ? data[0] : data,
    }
  }
}
