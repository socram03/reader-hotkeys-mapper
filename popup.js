(() => {
  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var s;
  var a;
  var h;
  var p;
  var v;
  var y;
  var d = {};
  var w = [];
  var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var g = Array.isArray;
  function m(n2, l2) {
    for (var u2 in l2)
      n2[u2] = l2[u2];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l2, u2, t2) {
    var i2, r2, o2, e2 = {};
    for (o2 in u2)
      o2 == "key" ? i2 = u2[o2] : o2 == "ref" ? r2 = u2[o2] : e2[o2] = u2[o2];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), typeof l2 == "function" && l2.defaultProps != null)
      for (o2 in l2.defaultProps)
        e2[o2] === undefined && (e2[o2] = l2.defaultProps[o2]);
    return x(l2, e2, i2, r2, null);
  }
  function x(n2, t2, i2, r2, o2) {
    var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: o2 == null ? ++u : o2, __i: -1, __u: 0 };
    return o2 == null && l.vnode != null && l.vnode(e2), e2;
  }
  function S(n2) {
    return n2.children;
  }
  function C(n2, l2) {
    this.props = n2, this.context = l2;
  }
  function $(n2, l2) {
    if (l2 == null)
      return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u2;l2 < n2.__k.length; l2++)
      if ((u2 = n2.__k[l2]) != null && u2.__e != null)
        return u2.__e;
    return typeof n2.type == "function" ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u2 = n2.__v, t2 = u2.__e, i2 = [], r2 = [], o2 = m({}, u2);
      o2.__v = u2.__v + 1, l.vnode && l.vnode(o2), q(n2.__P, o2, u2, n2.__n, n2.__P.namespaceURI, 32 & u2.__u ? [t2] : null, i2, t2 == null ? $(u2) : t2, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t2 && P(o2);
    }
  }
  function P(n2) {
    if ((n2 = n2.__) != null && n2.__c != null)
      return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
        if (l2 != null && l2.__e != null)
          return n2.__e = n2.__c.base = l2.__e;
      }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l2 = 1;i.length; )
        i.length > l2 && i.sort(e), n2 = i.shift(), l2 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
    var a2, h2, p2, v2, y2, _2, g2, m2 = t2 && t2.__k || w, b2 = l2.length;
    for (f2 = T(u2, l2, m2, f2, b2), a2 = 0;a2 < b2; a2++)
      (p2 = u2.__k[a2]) != null && (h2 = p2.__i != -1 && m2[p2.__i] || d, p2.__i = a2, _2 = q(n2, p2, h2, i2, r2, o2, e2, f2, c2, s2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J(h2.ref, null, p2), s2.push(p2.ref, p2.__c || v2, p2)), y2 == null && v2 != null && (y2 = v2), (g2 = !!(4 & p2.__u)) || h2.__k === p2.__k ? (f2 = j(p2, f2, n2, g2), g2 && h2.__e && (h2.__e = null)) : typeof p2.type == "function" && _2 !== undefined ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
    return u2.__e = y2, f2;
  }
  function T(n2, l2, u2, t2, i2) {
    var r2, o2, e2, f2, c2, s2 = u2.length, a2 = s2, h2 = 0;
    for (n2.__k = new Array(i2), r2 = 0;r2 < i2; r2++)
      (o2 = l2[r2]) != null && typeof o2 != "boolean" && typeof o2 != "function" ? (typeof o2 == "string" || typeof o2 == "number" || typeof o2 == "bigint" || o2.constructor == String ? o2 = n2.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n2.__k[r2] = x(S, { children: o2 }, null, null, null) : o2.constructor === undefined && o2.__b > 0 ? o2 = n2.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, (c2 = o2.__i = O(o2, u2, f2, a2)) != -1 && (a2--, (e2 = u2[c2]) && (e2.__u |= 2)), e2 == null || e2.__v == null ? (c2 == -1 && (i2 > s2 ? h2-- : i2 < s2 && h2++), typeof o2.type != "function" && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
    if (a2)
      for (r2 = 0;r2 < s2; r2++)
        (e2 = u2[r2]) != null && (2 & e2.__u) == 0 && (e2.__e == t2 && (t2 = $(e2)), K(e2, e2));
    return t2;
  }
  function j(n2, l2, u2, t2) {
    var i2, r2;
    if (typeof n2.type == "function") {
      for (i2 = n2.__k, r2 = 0;i2 && r2 < i2.length; r2++)
        i2[r2] && (i2[r2].__ = n2, l2 = j(i2[r2], l2, u2, t2));
      return l2;
    }
    n2.__e != l2 && (t2 && (l2 && n2.type && !l2.parentNode && (l2 = $(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
    do {
      l2 = l2 && l2.nextSibling;
    } while (l2 != null && l2.nodeType == 8);
    return l2;
  }
  function O(n2, l2, u2, t2) {
    var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], s2 = c2 != null && (2 & c2.__u) == 0;
    if (c2 === null && e2 == null || s2 && e2 == c2.key && f2 == c2.type)
      return u2;
    if (t2 > (s2 ? 1 : 0)) {
      for (i2 = u2 - 1, r2 = u2 + 1;i2 >= 0 || r2 < l2.length; )
        if ((c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) != null && (2 & c2.__u) == 0 && e2 == c2.key && f2 == c2.type)
          return o2;
    }
    return -1;
  }
  function z(n2, l2, u2) {
    l2[0] == "-" ? n2.setProperty(l2, u2 == null ? "" : u2) : n2[l2] = u2 == null ? "" : typeof u2 != "number" || _.test(l2) ? u2 : u2 + "px";
  }
  function N(n2, l2, u2, t2, i2) {
    var r2, o2;
    n:
      if (l2 == "style")
        if (typeof u2 == "string")
          n2.style.cssText = u2;
        else {
          if (typeof t2 == "string" && (n2.style.cssText = t2 = ""), t2)
            for (l2 in t2)
              u2 && l2 in u2 || z(n2.style, l2, "");
          if (u2)
            for (l2 in u2)
              t2 && u2[l2] == t2[l2] || z(n2.style, l2, u2[l2]);
        }
      else if (l2[0] == "o" && l2[1] == "n")
        r2 = l2 != (l2 = l2.replace(a, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || l2 == "onFocusOut" || l2 == "onFocusIn" ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2[s] = t2[s] : (u2[s] = h, n2.addEventListener(l2, r2 ? v : p, r2)) : n2.removeEventListener(l2, r2 ? v : p, r2);
      else {
        if (i2 == "http://www.w3.org/2000/svg")
          l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if (l2 != "width" && l2 != "height" && l2 != "href" && l2 != "list" && l2 != "form" && l2 != "tabIndex" && l2 != "download" && l2 != "rowSpan" && l2 != "colSpan" && l2 != "role" && l2 != "popover" && l2 in n2)
          try {
            n2[l2] = u2 == null ? "" : u2;
            break n;
          } catch (n3) {}
        typeof u2 == "function" || (u2 == null || u2 === false && l2[4] != "-" ? n2.removeAttribute(l2) : n2.setAttribute(l2, l2 == "popover" && u2 == 1 ? "" : u2));
      }
  }
  function V(n2) {
    return function(u2) {
      if (this.l) {
        var t2 = this.l[u2.type + n2];
        if (u2[c] == null)
          u2[c] = h++;
        else if (u2[c] < t2[s])
          return;
        return t2(l.event ? l.event(u2) : u2);
      }
    };
  }
  function q(n2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
    var a2, h2, p2, v2, y2, d2, _2, k2, x2, M, $2, I2, P2, A2, H2, T2 = u2.type;
    if (u2.constructor !== undefined)
      return null;
    128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (a2 = l.__b) && a2(u2);
    n:
      if (typeof T2 == "function")
        try {
          if (k2 = u2.props, x2 = T2.prototype && T2.prototype.render, M = (a2 = T2.contextType) && i2[a2.__c], $2 = a2 ? M ? M.props.value : a2.__ : i2, t2.__c ? _2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (x2 ? u2.__c = h2 = new T2(k2, $2) : (u2.__c = h2 = new C(k2, $2), h2.constructor = T2, h2.render = Q), M && M.sub(h2), h2.state || (h2.state = {}), h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), x2 && h2.__s == null && (h2.__s = h2.state), x2 && T2.getDerivedStateFromProps != null && (h2.__s == h2.state && (h2.__s = m({}, h2.__s)), m(h2.__s, T2.getDerivedStateFromProps(k2, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2)
            x2 && T2.getDerivedStateFromProps == null && h2.componentWillMount != null && h2.componentWillMount(), x2 && h2.componentDidMount != null && h2.__h.push(h2.componentDidMount);
          else {
            if (x2 && T2.getDerivedStateFromProps == null && k2 !== v2 && h2.componentWillReceiveProps != null && h2.componentWillReceiveProps(k2, $2), u2.__v == t2.__v || !h2.__e && h2.shouldComponentUpdate != null && h2.shouldComponentUpdate(k2, h2.__s, $2) === false) {
              u2.__v != t2.__v && (h2.props = k2, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
                n3 && (n3.__ = u2);
              }), w.push.apply(h2.__h, h2._sb), h2._sb = [], h2.__h.length && e2.push(h2);
              break n;
            }
            h2.componentWillUpdate != null && h2.componentWillUpdate(k2, h2.__s, $2), x2 && h2.componentDidUpdate != null && h2.__h.push(function() {
              h2.componentDidUpdate(v2, y2, d2);
            });
          }
          if (h2.context = $2, h2.props = k2, h2.__P = n2, h2.__e = false, I2 = l.__r, P2 = 0, x2)
            h2.state = h2.__s, h2.__d = false, I2 && I2(u2), a2 = h2.render(h2.props, h2.state, h2.context), w.push.apply(h2.__h, h2._sb), h2._sb = [];
          else
            do {
              h2.__d = false, I2 && I2(u2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
            } while (h2.__d && ++P2 < 25);
          h2.state = h2.__s, h2.getChildContext != null && (i2 = m(m({}, i2), h2.getChildContext())), x2 && !p2 && h2.getSnapshotBeforeUpdate != null && (d2 = h2.getSnapshotBeforeUpdate(v2, y2)), A2 = a2 != null && a2.type === S && a2.key == null ? E(a2.props.children) : a2, f2 = L(n2, g(A2) ? A2 : [A2], u2, t2, i2, r2, o2, e2, f2, c2, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), _2 && (h2.__E = h2.__ = null);
        } catch (n3) {
          if (u2.__v = null, c2 || o2 != null)
            if (n3.then) {
              for (u2.__u |= c2 ? 160 : 128;f2 && f2.nodeType == 8 && f2.nextSibling; )
                f2 = f2.nextSibling;
              o2[o2.indexOf(f2)] = null, u2.__e = f2;
            } else {
              for (H2 = o2.length;H2--; )
                b(o2[H2]);
              B(u2);
            }
          else
            u2.__e = t2.__e, u2.__k = t2.__k, n3.then || B(u2);
          l.__e(n3, u2, t2);
        }
      else
        o2 == null && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = G(t2.__e, u2, t2, i2, r2, o2, e2, c2, s2);
    return (a2 = l.diffed) && a2(u2), 128 & u2.__u ? undefined : f2;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u2, t2) {
    for (var i2 = 0;i2 < t2.length; i2++)
      J(t2[i2], t2[++i2], t2[++i2]);
    l.__c && l.__c(u2, n2), n2.some(function(u3) {
      try {
        n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
          n3.call(u3);
        });
      } catch (n3) {
        l.__e(n3, u3.__v);
      }
    });
  }
  function E(n2) {
    return typeof n2 != "object" || n2 == null || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : m({}, n2);
  }
  function G(u2, t2, i2, r2, o2, e2, f2, c2, s2) {
    var a2, h2, p2, v2, y2, w2, _2, m2 = i2.props || d, k2 = t2.props, x2 = t2.type;
    if (x2 == "svg" ? o2 = "http://www.w3.org/2000/svg" : x2 == "math" ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), e2 != null) {
      for (a2 = 0;a2 < e2.length; a2++)
        if ((y2 = e2[a2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : y2.nodeType == 3)) {
          u2 = y2, e2[a2] = null;
          break;
        }
    }
    if (u2 == null) {
      if (x2 == null)
        return document.createTextNode(k2);
      u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t2, e2), c2 = false), e2 = null;
    }
    if (x2 == null)
      m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
    else {
      if (e2 = e2 && n.call(u2.childNodes), !c2 && e2 != null)
        for (m2 = {}, a2 = 0;a2 < u2.attributes.length; a2++)
          m2[(y2 = u2.attributes[a2]).name] = y2.value;
      for (a2 in m2)
        y2 = m2[a2], a2 == "dangerouslySetInnerHTML" ? p2 = y2 : a2 == "children" || (a2 in k2) || a2 == "value" && ("defaultValue" in k2) || a2 == "checked" && ("defaultChecked" in k2) || N(u2, a2, null, y2, o2);
      for (a2 in k2)
        y2 = k2[a2], a2 == "children" ? v2 = y2 : a2 == "dangerouslySetInnerHTML" ? h2 = y2 : a2 == "value" ? w2 = y2 : a2 == "checked" ? _2 = y2 : c2 && typeof y2 != "function" || m2[a2] === y2 || N(u2, a2, y2, m2[a2], o2);
      if (h2)
        c2 || p2 && (h2.__html == p2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
      else if (p2 && (u2.innerHTML = ""), L(t2.type == "template" ? u2.content : u2, g(v2) ? v2 : [v2], t2, i2, r2, x2 == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $(i2, 0), c2, s2), e2 != null)
        for (a2 = e2.length;a2--; )
          b(e2[a2]);
      c2 || (a2 = "value", x2 == "progress" && w2 == null ? u2.removeAttribute("value") : w2 != null && (w2 !== u2[a2] || x2 == "progress" && !w2 || x2 == "option" && w2 != m2[a2]) && N(u2, a2, w2, m2[a2], o2), a2 = "checked", _2 != null && _2 != u2[a2] && N(u2, a2, _2, m2[a2], o2));
    }
    return u2;
  }
  function J(n2, u2, t2) {
    try {
      if (typeof n2 == "function") {
        var i2 = typeof n2.__u == "function";
        i2 && n2.__u(), i2 && u2 == null || (n2.__u = n2(u2));
      } else
        n2.current = u2;
    } catch (n3) {
      l.__e(n3, t2);
    }
  }
  function K(n2, u2, t2) {
    var i2, r2;
    if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J(i2, null, u2)), (i2 = n2.__c) != null) {
      if (i2.componentWillUnmount)
        try {
          i2.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u2);
        }
      i2.base = i2.__P = null;
    }
    if (i2 = n2.__k)
      for (r2 = 0;r2 < i2.length; r2++)
        i2[r2] && K(i2[r2], u2, t2 || typeof n2.type != "function");
    t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = undefined;
  }
  function Q(n2, l2, u2) {
    return this.constructor(n2, u2);
  }
  function R(u2, t2, i2) {
    var r2, o2, e2, f2;
    t2 == document && (t2 = document.documentElement), l.__ && l.__(u2, t2), o2 = (r2 = typeof i2 == "function") ? null : i2 && i2.__k || t2.__k, e2 = [], f2 = [], q(t2, u2 = (!r2 && i2 || t2).__k = k(S, null, [u2]), o2 || d, d, t2.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r2, f2), D(e2, u2, f2);
  }
  n = w.slice, l = { __e: function(n2, l2, u2, t2) {
    for (var i2, r2, o2;l2 = l2.__; )
      if ((i2 = l2.__c) && !i2.__)
        try {
          if ((r2 = i2.constructor) && r2.getDerivedStateFromError != null && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), i2.componentDidCatch != null && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2)
            return i2.__E = i2;
        } catch (l3) {
          n2 = l3;
        }
    throw n2;
  } }, u = 0, t = function(n2) {
    return n2 != null && n2.constructor === undefined;
  }, C.prototype.setState = function(n2, l2) {
    var u2;
    u2 = this.__s != null && this.__s != this.state ? this.__s : this.__s = m({}, this.state), typeof n2 == "function" && (n2 = n2(m({}, u2), this.props)), n2 && m(u2, n2), n2 != null && this.__v && (l2 && this._sb.push(l2), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S, i = [], o = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
    return n2.__v.__b - l2.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, s = "__a" + f, a = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

  // node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m2 = c2.unmount;
  var s2 = c2.__;
  function p2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
  }
  function d2(n2) {
    return o2 = 1, h2(D2, n2);
  }
  function h2(n2, u3, i3) {
    var o3 = p2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(undefined, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H)
          return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        }))
          return !c3 || c3.call(this, n3, t3, r3);
        var i4 = o3.__c.props !== n3;
        return u4.some(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = undefined, t4 !== n4.__[0] && (i4 = true);
          }
        }), c3 && c3.call(this, n3, t3, r3) || i4;
      };
      r2.__f = true;
      var { shouldComponentUpdate: c3, componentWillUpdate: e3 } = r2;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u4 = c3;
          c3 = undefined, f3(n3, t3, r3), c3 = u4;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f3;
    }
    return o3.__N || o3.__;
  }
  function y2(n2, u3) {
    var i3 = p2(t2++, 3);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
  }
  function j2() {
    for (var n2;n2 = f2.shift(); ) {
      var t3 = n2.__H;
      if (n2.__P && t3)
        try {
          t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
        } catch (r3) {
          t3.__h = [], c2.__e(r3, n2.__v);
        }
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = undefined;
    })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (f2.push(t3) !== 1 && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
      n3.u && (n3.__H = n3.u), n3.u = undefined;
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m2 && m2(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.some(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t3 = n4;
      }
    }), r3.__H = undefined, t3 && c2.__e(t3, r3.__v));
  };
  var k2 = typeof requestAnimationFrame == "function";
  function w2(n2) {
    var t3, r3 = function() {
      clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u3 = setTimeout(r3, 35);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u3 = n2.__c;
    typeof u3 == "function" && (n2.__c = undefined, u3()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D2(n2, t3) {
    return typeof t3 == "function" ? t3(n2) : t3;
  }

  // src/shared/extensionStorage.ts
  var extensionStorage = createExtensionStorage();
  function createExtensionStorage() {
    return {
      get(keys) {
        return chrome.storage.local.get(keys);
      },
      async set(values) {
        await chrome.storage.local.set(values);
      }
    };
  }
  // src/shared/reader.ts
  var READER_STATUS_MESSAGE = { type: "reader:get-status" };
  async function sendMessageToTab(tabId, message) {
    return chrome.tabs.sendMessage(tabId, message);
  }
  async function getReaderStatus(tabId) {
    return sendMessageToTab(tabId, READER_STATUS_MESSAGE);
  }
  async function injectReaderScript(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  }
  async function ensureReaderScript(tabId) {
    try {
      const status = await getReaderStatus(tabId);
      if (isReaderStatusReady(status))
        return status;
      return waitForReaderStatus(tabId);
    } catch {
      await injectReaderScript(tabId);
      return waitForReaderStatus(tabId);
    }
  }
  async function sendReaderMessage(tabId, message) {
    await ensureReaderScript(tabId);
    return sendMessageToTab(tabId, message);
  }
  async function waitForReaderStatus(tabId, retries = 6) {
    let lastError = null;
    for (let attempt = 0;attempt < retries; attempt += 1) {
      try {
        const status = await getReaderStatus(tabId);
        if (isReaderStatusReady(status))
          return status;
      } catch (error) {
        lastError = error;
      }
      await delay(150 * (attempt + 1));
    }
    throw lastError || new Error("No pude confirmar el estado del lector.");
  }
  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  function isReaderStatusReady(status) {
    return ["idle", "true"].includes(String(status?.readyState ?? ""));
  }
  // src/shared/tabs.ts
  var TARGET_PROTOCOLS = new Set(["http:", "https:", "file:"]);
  async function getTargetTabs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter((tab) => isTargetableTabUrl(tab.url)).sort((left, right) => {
      const activeDelta = Number(right.active) - Number(left.active);
      if (activeDelta !== 0)
        return activeDelta;
      return (right.lastAccessed || 0) - (left.lastAccessed || 0);
    });
  }
  async function getBestTargetTab() {
    const tabs = await getTargetTabs();
    return tabs[0] || null;
  }
  function isTargetableTabUrl(url) {
    if (!url)
      return false;
    try {
      const parsed = new URL(url);
      return TARGET_PROTOCOLS.has(parsed.protocol);
    } catch {
      return false;
    }
  }
  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f3 = 0;
  function u3(e3, t3, n2, o3, i3, u4) {
    t3 || (t3 = {});
    var a3, c3, p3 = t3;
    if ("ref" in p3)
      for (c3 in p3 = {}, t3)
        c3 == "ref" ? a3 = t3[c3] : p3[c3] = t3[c3];
    var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
    if (typeof e3 == "function" && (a3 = e3.defaultProps))
      for (c3 in a3)
        p3[c3] === undefined && (p3[c3] = a3[c3]);
    return l.vnode && l.vnode(l3), l3;
  }

  // src/popup/PopupApp.tsx
  function PopupApp() {
    const [targetTab, setTargetTab] = d2(null);
    const [status, setStatus] = d2(null);
    const [error, setError] = d2("");
    y2(() => {
      initialize();
    }, []);
    async function initialize() {
      try {
        const tab = await getBestTargetTab();
        setTargetTab(tab);
        if (!tab?.id) {
          setError("No encontre una pestana web compatible en esta ventana.");
          return;
        }
        const nextStatus = await ensureReaderScript(tab.id);
        setStatus(nextStatus);
        setError("");
      } catch (nextError) {
        setError(`No pude preparar la extension en la pestana objetivo: ${getErrorMessage(nextError)}`);
      }
    }
    async function runTabAction(type, options) {
      if (!targetTab?.id)
        return;
      try {
        const nextStatus = await sendReaderMessage(targetTab.id, { type });
        setStatus(nextStatus);
        setError("");
        if (options?.closeAfter)
          window.close();
      } catch (nextError) {
        setError(`No pude comunicarme con la pestana objetivo: ${getErrorMessage(nextError)}`);
      }
    }
    async function runResumeAction() {
      if (!targetTab?.id || !status?.lastReadHref)
        return;
      try {
        if (status.lastReadIsCurrentChapter) {
          await sendReaderMessage(targetTab.id, { type: "reader:resume-last-read" });
        } else {
          await chrome.tabs.update(targetTab.id, { url: String(status.lastReadHref) });
        }
        setError("");
        window.close();
      } catch (nextError) {
        setError(`No pude retomar la lectura: ${getErrorMessage(nextError)}`);
      }
    }
    const hasReader = Boolean(status?.siteDetected);
    const hasCandidateMapping = Boolean(status?.canToggleActivation);
    const isBuiltInSite = Boolean(status?.isBuiltInSite);
    const matchedMappingEnabled = status?.matchedMappingEnabled !== false;
    const zenActive = Boolean(status?.settings?.focusMode);
    const autoNextActive = Boolean(status?.settings?.autoNext);
    const hasLastRead = Boolean(status?.lastReadAvailable && status?.lastReadHref);
    const lastReadLabel = status?.lastReadTitle || "Sin progreso guardado";
    const activationMessage = hasCandidateMapping && !matchedMappingEnabled ? "Sitio personalizado desactivado" : hasReader ? status?.siteLabel || "Lector detectado" : "Sin mapeo activo";
    return /* @__PURE__ */ u3("main", {
      class: "popup",
      children: [
        /* @__PURE__ */ u3("header", {
          class: "hero",
          children: [
            /* @__PURE__ */ u3("div", {
              class: "brand",
              children: [
                /* @__PURE__ */ u3("div", {
                  class: "brand-icon",
                  children: /* @__PURE__ */ u3("svg", {
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ u3("path", {
                      d: "M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "brand-text",
                  children: [
                    /* @__PURE__ */ u3("p", {
                      class: "eyebrow",
                      children: "Reader Hotkeys"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("h1", {
                      children: "Control"
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("button", {
              class: "btn-options",
              type: "button",
              onClick: () => chrome.runtime.openOptionsPage(),
              children: "Config"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        error ? /* @__PURE__ */ u3("div", {
          class: "error-msg",
          children: error
        }, undefined, false, undefined, this) : /* @__PURE__ */ u3("section", {
          class: "status-card",
          children: [
            /* @__PURE__ */ u3("div", {
              class: "status-header",
              children: [
                /* @__PURE__ */ u3("div", {
                  children: [
                    /* @__PURE__ */ u3("div", {
                      class: "status-host",
                      children: status?.host || "—"
                    }, undefined, false, undefined, this),
                    status?.pathname && /* @__PURE__ */ u3("div", {
                      class: "status-path",
                      children: status.pathname
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("span", {
                  class: `led ${hasReader ? "on" : "off"}`,
                  children: hasReader ? "Activo" : "Inactivo"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "status-meta",
              children: [
                /* @__PURE__ */ u3("div", {
                  class: "meta-row",
                  children: [
                    /* @__PURE__ */ u3("span", {
                      class: "meta-label",
                      children: "Contexto"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("span", {
                      class: "meta-value",
                      children: activationMessage
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "meta-row",
                  children: [
                    /* @__PURE__ */ u3("span", {
                      class: "meta-label",
                      children: "Mapeos"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("span", {
                      class: `meta-value ${!status?.hostMappingCount ? "dim" : ""}`,
                      children: [
                        status?.hostMappingCount || 0,
                        " en host",
                        status?.matchedMappingLabel ? ` · ${status.matchedMappingLabel}` : ""
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "meta-row",
                  children: [
                    /* @__PURE__ */ u3("span", {
                      class: "meta-label",
                      children: "Modos"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("span", {
                      class: "meta-value",
                      children: [
                        "Zen ",
                        zenActive ? "●" : "○",
                        "   Scroll ",
                        autoNextActive ? "●" : "○"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u3("div", {
                  class: "meta-row",
                  children: [
                    /* @__PURE__ */ u3("span", {
                      class: "meta-label",
                      children: "Ultimo"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ u3("span", {
                      class: `meta-value ${hasLastRead ? "" : "dim"}`,
                      children: lastReadLabel
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ u3("section", {
          class: "actions",
          children: [
            /* @__PURE__ */ u3("button", {
              id: "start-mapper",
              class: `key-btn primary full-width`,
              type: "button",
              disabled: Boolean(error) || !targetTab?.id,
              onClick: () => runTabAction("reader:start-mapper", { closeAfter: true }),
              children: hasCandidateMapping ? "⌥ Ajustar mapeo" : "⌥ Iniciar mapeo"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("button", {
              id: "toggle-site-activation",
              class: `key-btn ${matchedMappingEnabled && hasCandidateMapping ? "active" : ""}`,
              type: "button",
              disabled: Boolean(error) || !hasCandidateMapping || isBuiltInSite,
              onClick: () => runTabAction("reader:toggle-current-mapping"),
              children: matchedMappingEnabled ? "Desactivar sitio" : "Activar sitio"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("button", {
              id: "toggle-focus",
              class: `key-btn ${zenActive ? "active" : ""}`,
              type: "button",
              disabled: !hasReader,
              onClick: () => runTabAction("reader:toggle-focus"),
              children: [
                zenActive ? "Zen ON" : "Zen",
                /* @__PURE__ */ u3("span", {
                  class: "key-label",
                  children: "z"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("button", {
              id: "toggle-auto-next",
              class: `key-btn ${autoNextActive ? "active" : ""}`,
              type: "button",
              disabled: !hasReader,
              onClick: () => runTabAction("reader:toggle-auto-next"),
              children: [
                autoNextActive ? "Scroll ON" : "Auto-scroll",
                /* @__PURE__ */ u3("span", {
                  class: "key-label",
                  children: "a"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("button", {
              id: "resume-last-read",
              class: "key-btn",
              type: "button",
              disabled: !hasLastRead,
              onClick: () => void runResumeAction(),
              children: [
                "Retomar",
                /* @__PURE__ */ u3("span", {
                  class: "key-label",
                  children: "l"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("button", {
              id: "open-help",
              class: "key-btn",
              type: "button",
              disabled: !hasReader,
              onClick: () => runTabAction("reader:open-help", { closeAfter: true }),
              children: [
                "Ayuda",
                /* @__PURE__ */ u3("span", {
                  class: "key-label",
                  children: "?"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ u3("footer", {
          class: "shortcuts",
          children: [
            /* @__PURE__ */ u3("div", {
              class: "shortcuts-title",
              children: "Atajos rapidos"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "shortcut-row",
              children: [
                /* @__PURE__ */ u3("span", {
                  class: "key",
                  children: "m"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("span", {
                  children: "Volver a la obra"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "shortcut-row",
              children: [
                /* @__PURE__ */ u3("span", {
                  class: "key",
                  children: "l"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("span", {
                  children: "Retomar ultimo capitulo"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "shortcut-row",
              children: [
                /* @__PURE__ */ u3("span", {
                  class: "key",
                  children: "z"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("span", {
                  children: "Alternar modo zen"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u3("div", {
              class: "shortcut-row",
              children: [
                /* @__PURE__ */ u3("span", {
                  class: "key",
                  children: "j/k"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ u3("span", {
                  children: "Siguiente / anterior"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error || "Error desconocido");
  }

  // src/popup/app.tsx
  var container = document.getElementById("app");
  if (!container) {
    throw new Error("No encontre el contenedor del popup.");
  }
  R(/* @__PURE__ */ u3(PopupApp, {}, undefined, false, undefined, this), container);
})();
