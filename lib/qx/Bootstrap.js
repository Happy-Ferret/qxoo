require('qx');
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/* ************************************************************************

#resource(qx.static:qx/static)
#ignore(qx.data)
#use(qx.lang.Core)
#use(qx.lang.Generics)

************************************************************************ */

/**
 * Create namespace
 */
(function() {
  var glob;
  
  try {
    if (window.toString() == "[object Window]") {      
      var glob = window;
    }
  } catch(e) {}
  
  if (!glob)
  {
    try {
      if (global.toString() == "[object global]") {
        var glob = global;
      }
    } catch(e) {}
  }
  
  if (!glob.qx) {
    glob.qx = {
      global: glob
    };
  }
})(); 


/**
 * Bootstrap qx.Bootstrap to create myself later
 * This is needed for the API browser etc. to let them detect me
 */
qx.Bootstrap = {

  genericToString : function() {
    return "[Class " + this.classname + "]";
  },

  createNamespace : function(name, object)
  {
    var splits = name.split(".");
    var parent = qx.global;
    var part = splits[0];

    for (var i=0, len=splits.length-1; i<len; i++, part=splits[i])
    {
      if (!parent[part]) {
        parent = parent[part] = {};
      } else {
        parent = parent[part];
      }
    }

    // store object
    parent[part] = object;

    // return last part name (e.g. classname)
    return part;
  },


  setDisplayName : function(fcn, classname, name)
  {
    fcn.displayName = classname + "." + name + "()";
  },


  setDisplayNames : function(functionMap, classname)
  {
    for (var name in functionMap)
    {
      var value = functionMap[name];
      if (value instanceof Function) {
        value.displayName = classname + "." + name + "()";
      }
    }
  },


  define : function(name, config)
  {
    if (!config) {
      var config = { statics : {} };
    }

    var clazz;
    var proto = null;

    qx.Bootstrap.setDisplayNames(config.statics, name);

    if (config.members)
    {
      qx.Bootstrap.setDisplayNames(config.members, name + ".prototype");

      clazz = config.construct || new Function;
      var statics = config.statics;
      for (var key in statics) {
        clazz[key] = statics[key];
      }

      proto = clazz.prototype;
      var members = config.members;
      for (var key in members) {
        proto[key] = members[key];
      }
    }
    else
    {
      clazz = config.statics || {};
    }

    // Create namespace
    var basename = this.createNamespace(name, clazz);

    // Store names in constructor/object
    clazz.name = clazz.classname = name;
    clazz.basename = basename;

    // Store type info
    clazz.$$type = "Class";

    // Attach toString
    if (!clazz.hasOwnProperty("toString")) {
      clazz.toString = this.genericToString;
    }

    // Execute defer section
    if (config.defer) {
      config.defer(clazz, proto);
    }

    // Store class reference in global class registry
    qx.Bootstrap.$$registry[name] = config.statics;
    
    return clazz;
  }
};


/**
 * Internal class that is responsible for bootstrapping the qooxdoo
 * framework at load time.
 *
 * Automatically loads JavaScript language fixes and enhancements to
 * bring all engines to at least JavaScript 1.6.
 *
 * Does support:
 *
 * * Statics
 * * Members
 * * Defer
 *
 * Does not support:
 *
 * * Custom extends
 * * Super class calls
 * * Mixins, Interfaces, Properties, ...
 */
qx.Bootstrap.define("qx.Bootstrap",
{
  statics :
  {
    /** Timestamp of qooxdoo based application startup */
    LOADSTART : qx.$$start || new Date(),


    /**
     * Creates a namespace and assigns the given object to it.
     * Lightweight version of {@link qx.Class#createNamespace} only used during bootstrap phase.
     *
     * @internal
     * @param name {String} The complete namespace to create. Typically, the last part is the class name itself
     * @param object {Object} The object to attach to the namespace
     * @return {Object} last part of the namespace (typically the class name)
     * @throws an exception when the given object already exists.
     */
    createNamespace : qx.Bootstrap.createNamespace,


    /**
     * Define a new class using the qooxdoo class system.
     * Lightweight version of {@link qx.Class#define} only used during bootstrap phase.
     *
     * @internal
     * @signature function(name, config)
     * @param name {String} Name of the class
     * @param config {Map ? null} Class definition structure.
     * @return {Class} The defined class
     */
    define : qx.Bootstrap.define,


    /**
     * Sets the display name of the given function
     *
     * @signature (fcn, classname, name)
     * @param fcn {Function} the function to set the display name for
     * @param classname {String} the name of the class the function is defined in
     * @param name {String} the function name
     */
    setDisplayName : qx.Bootstrap.setDisplayName,


    /**
     * Set the names of alls functions defined in the given map
     *
     * @signaure function(functionMap, classname)
     * @param functionMap {Object} a map with functions as values
     * @classname {String} the name of the class, the functions are defined in
     */
    setDisplayNames : qx.Bootstrap.setDisplayNames,

    /**
     * This method will be attached to all classes to return
     * a nice identifier for them.
     *
     * @internal
     * @signature function()
     * @return {String} The class identifier
     */
    genericToString : qx.Bootstrap.genericToString,


    /**
     * Find a class by its name
     *
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : function(name) {
      return qx.Bootstrap.$$registry[name];
    },


    /** {Map} Stores all defined classes */
    $$registry : {},
    
    
    /*
    ---------------------------------------------------------------------------
      OBJECT UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */    
    
    /**
     * Get the number of objects in the map
     *
     * @signature function(map)
     * @param map {Object} the map
     * @return {Integer} number of objects in the map
     */
    objectGetLength : (({}).__count__ == 0) ?
      function(map) {
        return map.__count__;
      }
      :
      function(map)
      {
        var length = 0;

        for (var key in map) {
          length++;
        }

        return length;
      },
    
    
    _shadowedKeys :
    [
      "isPrototypeOf",
      "hasOwnProperty",
      "toLocaleString",
      "toString",
      "valueOf"
    ],
    
    
    /**
     * Get the keys of a map as array as returned by a "for ... in" statement.
     *
     * @signature function(map)
     * @param map {Object} the map
     * @return {Array} array of the keys of the map
     */
    getKeys : (function() {for (var key in {toString : 1}) { return key }})() !== "toString" ?
      function(map)
      {
        var arr = [];
        for (var key in map) {
          arr.push(key);
        }

        // IE does not return "shadowed" keys even if they are defined directly
        // in the object. This is incompatible with the ECMA standard!!
        // This is why this checks are needed.
        var shadowedKeys = qx.Bootstrap.__shadowedKeys;
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        for (var i=0, a=shadowedKeys, l=a.length; i<l; i++)
        {
          if (hasOwnProperty.call(map, a[i])) {
            arr.push(a[i]);
          }
        }

        return arr;
      }
      :
      function(map)
      {
        var arr = [];

        for (var key in map) {
          arr.push(key);
        }

        return arr;
      },
    
    
    /**
     * Get the keys of a map as string
     *
     * @param map {Object} the map
     * @return {String} String of the keys of the map
     *         The keys are separated by ", "
     */
    getKeysAsString : function(map)
    {
      var keys = qx.Bootstrap.getKeys(map);
      if (keys.length == 0) {
        return "";
      }

      return '"' + keys.join('\", "') + '"';
    },    
    
    
    __classToTypeMap :
    {
      "[object String]": "String",
      "[object Array]": "Array",
      "[object Object]": "Object",
      "[object RegExp]": "RegExp",
      "[object Number]": "Number",
      "[object Boolean]": "Boolean",
      "[object Date]": "Date",
      "[object Function]": "Function",
      "[object Error]": "Error"
    },

    
    /*
    ---------------------------------------------------------------------------
      STRING UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */ 
    
    
    /**
     * Convert the first character of the string to upper case.
     *
     * @param str {String} the string
     * @return {String} the string with a upper case first character
     */
    firstUp : function(str) {
      return str.charAt(0).toUpperCase() + str.substr(1);
    },


    /**
     * Convert the first character of the string to lower case.
     *
     * @param str {String} the string
     * @return {String} the string with a lower case first character
     */
    firstLow : function(str) {
      return str.charAt(0).toLowerCase() + str.substr(1);
    },
    

    /*
    ---------------------------------------------------------------------------
      TYPE UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */    

    /**
     * Get the internal class of the value. See
     * http://thinkweb2.com/projects/prototype/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
     * for details.
     *
     * @param value {var} value to get the class for
     * @return {String} the internal class of the value
     */
    getClass : function(value)
    {
      var classString = Object.prototype.toString.call(value);
      return (
        qx.Bootstrap.__classToTypeMap[classString] ||
        classString.slice(8, -1)
      );
    },


    /**
     * Whether the value is a string.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a string.
     */
    isString : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is a internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        typeof value === "string" ||
        qx.Bootstrap.getClass(value) == "String" ||
        value instanceof String ||
        (!!value && !!value.$$isString))
      );
    },


    /**
     * Whether the value is an array.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is an array.
     */
    isArray : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is a internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        value instanceof Array ||
        (value && qx.data && qx.data.IListData && qx.Bootstrap.hasInterface(value.constructor, qx.data.IListData) ) ||
        qx.Bootstrap.getClass(value) == "Array" ||
        (!!value && !!value.$$isArray))
      );
    },


    /**
     * Whether the value is an object. Note that buildin types like Window are
     * not reported to be objects.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is an object.
     */
    isObject : function(value) {
      return (
        value !== undefined &&
        value !== null &&
        qx.Bootstrap.getClass(value) == "Object"
      );
    },
   
    
    /**
     * Whether the value is a function.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a function.
     */
    isFunction : function(value) {
      return qx.Bootstrap.getClass(value) == "Function";
    },
    
    
    /*
    ---------------------------------------------------------------------------
      CLASS UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */  
    
    
    /**
     * Whether the given class exists
     *
     * @param name {String} class name to check
     * @return {Boolean} true if class exists
     */
    classIsDefined : function(name) {
      return qx.Bootstrap.getByName(name) !== undefined;
    },
    
    /**
     * Returns the definition of the given property. Returns null
     * if the property does not exist.
     *
     * TODO: Correctly support refined properties?
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Map|null} whether the object support the given event.
     */
    getPropertyDefinition : function(clazz, name)
    {
      while (clazz)
      {
        if (clazz.$$properties && clazz.$$properties[name]) {
          return clazz.$$properties[name];
        }

        clazz = clazz.superclass;
      }

      return null;
    },
    

    /**
     * Whether a class has the given property
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the property to check for
     * @return {Boolean} whether the class includes the given property.
     */
    hasProperty : function(clazz, name) {
      return !!qx.Bootstrap.getPropertyDefinition(clazz, name);
    },
    
    
    /**
     * Returns the event type of the given event. Returns null if
     * the event does not exist.
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the event
     * @return {Map|null} Event type of the given event.
     */
    getEventType : function(clazz, name)
    {
      var clazz = clazz.constructor;

      while (clazz.superclass)
      {
        if (clazz.$$events && clazz.$$events[name] !== undefined) {
          return clazz.$$events[name];
        }

        clazz = clazz.superclass;
      }

      return null;
    },
    
    
    /**
     * Whether a class supports the given event type
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Boolean} whether the class supports the given event.
     */
    supportsEvent : function(clazz, name) {
      return !!qx.Bootstrap.getEventType(clazz, name);
    },
    
    
    /**
     * Returns the class or one of its super classes which contains the
     * declaration of the given interface. Returns null if the interface is not
     * specified anywhere.
     *
     * @param clazz {Class} class to look for the interface
     * @param iface {Interface} interface to look for
     * @return {Class | null} the class which directly implements the given interface
     */
    getByInterface : function(clazz, iface)
    {
      var list, i, l;

      while (clazz)
      {
        if (clazz.$$implements)
        {
          list = clazz.$$flatImplements;

          for (i=0, l=list.length; i<l; i++)
          {
            if (list[i] === iface) {
              return clazz;
            }
          }
        }

        clazz = clazz.superclass;
      }

      return null;
    },
    
    
    /**
     * Whether a given class or any of its super classes includes a given interface.
     *
     * This function will return "true" if the interface was defined
     * in the class declaration (@link qx.Class#define}) of the class
     * or any of its super classes using the "implement"
     * key.
     *
     * @param clazz {Class} class to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class includes the interface.
     */
    hasInterface : function(clazz, iface) {
      return !!qx.Bootstrap.getByInterface(clazz, iface);
    },
    
    
    /**
     * Returns a list of all mixins available in a given class.
     *
     * @param clazz {Class} class which should be inspected
     * @return {Mixin[]} array of mixins this class uses
     */
    getMixins : function(clazz)
    {
      var list = [];

      while (clazz)
      {
        if (clazz.$$includes) {
          list.push.apply(list, clazz.$$flatIncludes);
        }

        clazz = clazz.superclass;
      }

      return list;
    },
    
    
    /*
    ---------------------------------------------------------------------------
      LOGGING UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */
    
    $$logs : [],
   
    
    /**
     * Sending a message at level "debug" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    debug : function(object, message) {
      qx.Bootstrap.$$logs.push(["debug", arguments]);
    },


    /**
     * Sending a message at level "info" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    info : function(object, message) {
      qx.Bootstrap.$$logs.push(["info", arguments]);
    },


    /**
     * Sending a message at level "warn" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    warn : function(object, message) {
      qx.Bootstrap.$$logs.push(["warn", arguments]);
    },


    /**
     * Sending a message at level "error" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    error : function(object, message) {
      qx.Bootstrap.$$logs.push(["error", arguments]);
    }    
  }
});
exports.Bootstrap = qx.Bootstrap;