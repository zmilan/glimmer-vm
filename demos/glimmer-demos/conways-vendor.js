enifed("cell", ["exports"], function (exports) {
  "use strict";

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var Cell = (function () {
    function Cell(x, y, isAlive) {
      _classCallCheck(this, Cell);

      this._meta = null;

      this._x = x;
      this._y = y;

      this.key = x + "x" + y;
      this._isAlive = isAlive;
      this.isAlive = isAlive;
      this.a = isAlive;
      this.b = false;
    }

    _createClass(Cell, [{
      key: "is",

      //get isAlive() { return this._isAlive; }

      value: function is(other) {
        return this.x === other.x && this.y === other.y;
      }
    }, {
      key: "toString",
      value: function toString() {
        return "cell(x: " + this.x + ", y: " + this.y + ")";
      }
    }, {
      key: "x",
      get: function get() {
        return this._x;
      }
    }, {
      key: "y",
      get: function get() {
        return this._y;
      }
    }]);

    return Cell;
  })();

  exports["default"] = Cell;
});
enifed('fate', ['exports'], function (exports) {
  'use strict';

  exports['default'] = fate;
  var LIVE = 'LIVE';
  exports.LIVE = LIVE;
  var DIE = 'DIE';

  exports.DIE = DIE;

  function fate(count) {
    if (count === 3) {
      return LIVE;
    }
    if (count === 4) {
      return LIVE;
    } // do nothing

    return DIE;
  }
});
enifed('world', ['exports', 'fate', 'cell'], function (exports, _fate, _cell) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  exports.alive = alive;
  exports.world = world;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var set = typeof Ember !== 'undefined' ? Ember.set : function (obj, key, value) {
    return obj[key] = value;
  };

  function alive(width, height, cells) {
    var result = new Array(width * height);

    for (var i = 0; i < result.length; i++) {
      result[i] = _fate.DIE;
    }

    for (var i = 0; i < cells.length; i++) {
      var _cells$i = _slicedToArray(cells[i], 2);

      var x = _cells$i[0];
      var y = _cells$i[1];

      result[y * width + x] = _fate.LIVE;
    }

    return result;
  }

  function world(width, height, _cells) {
    var cells = _cells.map(function (state, index) {
      return new _cell['default'](index % width, Math.floor(index / width), state === _fate.LIVE);
    });

    return new World({ width: width, height: height, cells: cells });
  }

  var World = (function () {
    function World(_ref) {
      var width = _ref.width;
      var height = _ref.height;
      var cells = _ref.cells;

      _classCallCheck(this, World);

      this.width = width;
      this.height = height;
      this.cells = cells; // ensure sorted

      this._current = 'a';
      this._next = 'b';
    }

    _createClass(World, [{
      key: 'forEach',
      value: function forEach(cb) {
        for (var i = 0; i < this.cells.length; i++) {
          cb(this.cells[i], i);
        }
      }
    }, {
      key: 'map',
      value: function map(cb) {
        var results = new Array(this.cells.length);
        for (var i = 0; i < this.cells.length; i++) {
          results[i] = cb(this.cells[i], i);
        }
        return results;
      }
    }, {
      key: 'advance',
      value: function advance() {
        var _this = this;

        this.forEach(function (cell) {
          set(cell, 'isAlive', cell[_this._next] = _this.willLive(cell));
        });

        var tmp = this._current;
        this._current = this._next;
        this._next = tmp;
      }
    }, {
      key: 'getAt',
      value: function getAt(x, y) {
        var width = this.width;
        var height = this.height;
        var cells = this.cells;

        if (x >= width || y >= height || x < 0 || y < 0) {
          return 0;
        }

        return cells[y * width + x][this._current] ? 1 : 0;
      }
    }, {
      key: 'willLive',
      value: function willLive(cell) {
        return (0, _fate['default'])(this.sum(cell)) === _fate.LIVE;
      }
    }, {
      key: 'sum',
      value: function sum(cell) {
        var x = cell.x;
        var y = cell.y;

        var sum = 0;

        sum += this.getAt(x - 1, y - 1);
        sum += this.getAt(x - 0, y - 1);
        sum += this.getAt(x + 1, y - 1);

        sum += this.getAt(x - 1, y - 0);
        sum += this.getAt(x - 0, y - 0);
        sum += this.getAt(x + 1, y - 0);

        sum += this.getAt(x - 1, y + 1);
        sum += this.getAt(x - 0, y + 1);
        sum += this.getAt(x + 1, y + 1);

        return sum;
      }
    }, {
      key: 'length',
      get: function get() {
        return this.cells.length;
      }
    }]);

    return World;
  })();

  exports['default'] = World;
});
enifed('worlds/one', ['exports', 'world'], function (exports, _world) {
  'use strict';

  exports['default'] = (0, _world.world)(199, 199, (0, _world.alive)(199, 199, [[1, 99], [2, 99], [3, 99], [4, 99], [5, 99], [6, 99], [7, 99], [8, 99], [10, 99], [11, 99], [12, 99], [13, 99], [14, 99], [18, 99], [19, 99], [20, 99], [27, 99], [28, 99], [29, 99], [30, 99], [31, 99], [32, 99], [33, 99], [35, 99], [36, 99], [37, 99], [38, 99], [39, 99]]));
});//# sourceMappingURL=conways.map