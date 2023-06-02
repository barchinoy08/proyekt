(function() {
  var Act, Color, add_to_tree_path, anim_or_appear, autorun, autorun_dur, autorun_loop, biggest_bbox, build_heap, buttons_edit_playing, buttons_edit_stopped, clear_tree_path, do_step, dur_index, durations, heap_extract_max, heap_insert, heap_sort, index_depth, index_height, init_draw, init_pointers, left_index, main, max, max_heapify_down, max_heapify_up, parent_index, right_index, set_cmd_buttons_usable, state, swap_indices;

  state = {
    A: [4, 8, 10, 20, 5, 6, 13, 12, 25, 15, 14, 0, 26, 9, 3, 1, 19, 2, 24, 28, 17, 23, 27, 7, 11, 29, 21, 30, 22, 18, 16]
  };

  parent_index = function(i) {
    var p;
    p = Math.floor((i - 1) / 2);
    return (0 < i ? p : i);
  };

  left_index = function(i, n) {
    var l;
    l = 2 * i + 1;
    return (l < n ? l : i);
  };

  right_index = function(i, n) {
    var r;
    r = 2 * i + 2;
    return (r < n ? r : i);
  };

  index_depth = function(i) {
    if (i === 0) {
      return 0;
    } else {
      return 1 + index_depth(parent_index(i));
    }
  };

  index_height = function(i, n) {
    var l;
    l = left_index(i, n);
    return (l === i ? 0 : 1 + index_height(l, n));
  };

  Act = {
    none: 0,
    swap: 1,
    set_n: 2,
    set_mhd: 3,
    set_mhu: 4,
    clear_path: 5
  };

  swap_indices = function*(A, i, j) {
    yield ({
      act: Act.swap,
      i: i,
      j: j,
      msg: `Swap A[${i}], A[${j}]`
    });
    return [A[i], A[j]] = [A[j], A[i]];
  };

  max_heapify_down = function*(A, n, i, from) { // O(log i)
    var c, l, r, to;
    [l, r] = [
      left_index(i,
      n),
      right_index(i,
      n) // O(1) indices
    ];
    c = (A[r] < A[l] ? l : r); // O(1) index of largest child
    to = {
      i: i,
      l: l,
      r: r,
      c: c
    };
    yield ({
      act: Act.set_mhd,
      from: from,
      to: to,
      msg: `Max Heapifying Down from A[${i}] = ${A[i]}`
    });
    if (A[i] < A[c]) {
      yield* swap_indices(A, i, c); // O(1) swap child
      return (yield* max_heapify_down(A, n, c, to)); // O(log c) recursive call
    } else {
      return (yield {
        act: Act.set_mhd,
        from: to,
        to: null,
        msg: ""
      });
    }
  };

  max_heapify_up = function*(A, n, i, from) { // O(log n - log i)
    var p, to;
    p = parent_index(i); // O(1) index of parent (or i)
    to = {
      i: i,
      p: p
    };
    yield ({
      act: Act.set_mhu,
      from: from,
      to: to,
      msg: `Max Heapifying Up from A[${i}] = ${A[i]}`
    });
    if (A[p] < A[i]) {
      yield* swap_indices(A, i, p); // O(1) swap parent
      return (yield* max_heapify_up(A, n, p, null)); // O(log n - log p) recursive call on parent
    } else {
      return (yield {
        act: Act.set_mhu,
        from: to,
        to: null,
        msg: ""
      });
    }
  };

  heap_insert = function*(A, n) { // A[n] is new value
    var new_n;
    if (n < A.length) {
      new_n = n + 1;
      yield ({
        act: Act.set_n,
        from: n,
        to: new_n,
        msg: `Increase n: ${n} -> ${new_n}`
      });
      return (yield* max_heapify_up(A, new_n, n, null));
    }
  };

  heap_extract_max = function*(A, n) { // max value to be put at A[n-1]
    var new_n;
    if (n > 0) {
      new_n = n - 1;
      yield ({
        act: Act.set_n,
        from: n,
        to: new_n,
        msg: `Decrease n: ${n} -> ${new_n}`
      });
      yield* swap_indices(A, 0, new_n);
      return (yield* max_heapify_down(A, new_n, 0, null));
    }
  };

  build_heap = function*(A) {
    var i, k, n, ref, results;
    n = A.length;
    if (n > 1) {
      yield ({
        act: Act.set_n,
        from: 0,
        to: n,
        msg: `Insert all ${n} elements`
      });
// O(n) loop forward over array
      results = [];
      for (i = k = ref = (Math.floor(n / 2)) - 1; (ref <= 0 ? k <= 0 : k >= 0); i = ref <= 0 ? ++k : --k) {
        yield* max_heapify_down(A, n, i); // O(log n - log i)) fix max heap
        results.push((yield {
          act: Act.clear_path,
          msg: ""
        }));
      }
      return results;
    }
  };

  heap_sort = function*(A) {
    var k, max_n, n, ref, results;
    max_n = A.length;
    if (max_n > 1) {
      yield* build_heap(A); // O(n) build
// O(n) loop backward over array
      results = [];
      for (n = k = ref = max_n; (ref <= 0 ? k < 0 : k > 0); n = ref <= 0 ? ++k : --k) {
        yield* heap_extract_max(A, n); // O(log n) extract and fix
        results.push((yield {
          act: Act.clear_path,
          msg: ""
        }));
      }
      return results;
    }
  };

  // find maximum width and height of all cells
  biggest_bbox = function(A) {
    var bbox, k, len, v, vbox;
    bbox = {
      width: 0,
      height: 0
    };
    for (k = 0, len = A.length; k < len; k++) {
      v = A[k];
      vbox = v.bbox();
      bbox.width = Math.max(bbox.width, vbox.width);
      bbox.height = Math.max(bbox.height, vbox.height);
    }
    return bbox;
  };

  max = function(A) {
    return A.reduce(function(a, b) {
      return Math.max(a, b);
    });
  };

  Color = net.brehaut.Color;

  init_draw = function(draw, A) {
    var anum, arect, array_group, array_nums, array_rects, ax, ay, bbox, cbox, color, d, flat_height, g, h, i, in_colors, k, ldx, len, len1, len2, len3, len4, len5, level, level_group, level_lines, li, line, lx, ly, m, margin, num_group, o, p, pcirc, prect, ptrs, q, rect_group, red, ref, ref1, s, snum, spacing, srect, stag_edge_group, stag_edges, stag_group, stag_height, stag_num_group, stag_nums, stag_rect_group, stag_rects, stag_top, sx, sy, tc, tcirc, tnum, tree_bot, tree_circle_group, tree_circles, tree_edge_group, tree_edges, tree_group, tree_height, tree_levels, tree_num_group, tree_nums, tree_top, tt, tx, ty, u, v, view_height, w, x, x_offset, x_spacing;
    tree_height = index_depth(A.length - 1);
    //####### flat array graphics ########
    array_group = draw.group();
    rect_group = array_group.group();
    num_group = array_group.group();
    level_group = array_group.group();
    // create text elements for numbers
    array_nums = (function() {
      var k, len, results;
      results = [];
      for (k = 0, len = A.length; k < len; k++) {
        v = A[k];
        results.push(num_group.text("" + v));
      }
      return results;
    })();
    // determine how big each cell of A should be
    bbox = biggest_bbox(array_nums);
    margin = 6;
    bbox.width += margin;
    bbox.height += margin;
    // create rectangles for each cell
    array_rects = (function() {
      var k, len, results;
      results = [];
      for (k = 0, len = A.length; k < len; k++) {
        v = A[k];
        results.push(rect_group.rect(bbox.width, bbox.height));
      }
      return results;
    })();
    // compute colors
    red = Color({
      hue: 0,
      saturation: 1,
      value: 1
    });
    in_colors = (function() {
      var k, len, results;
      results = [];
      for (k = 0, len = A.length; k < len; k++) {
        v = A[k];
        results.push(red.shiftHue(v * 10).lightenByRatio(0.55).toCSS());
      }
      return results;
    })();
// position array elements
    for (i = k = 0, len = A.length; k < len; i = ++k) {
      v = A[i];
      color = in_colors[i];
      anum = array_nums[i];
      arect = array_rects[i];
      // place array cell
      ax = bbox.width * i;
      ay = bbox.height;
      arect.fill(color).stroke('#fff').move(ax, ay);
      anum.center(arect.cx(), arect.cy());
    }
    // create level lines
    level_lines = [];
    for (d = m = 0, ref = tree_height; (0 <= ref ? m <= ref : m >= ref); d = 0 <= ref ? ++m : --m) {
      ldx = Math.pow(2, d) * bbox.width;
      lx = ldx - bbox.width;
      ly = 2 * bbox.height + 3;
      line = level_group.line(lx + 2, ly, lx + ldx - 4, ly).stroke({
        color: '#000',
        width: 2
      });
      level_lines.push(line);
    }
    flat_height = 3 * bbox.height;
    //####### staggered array graphics ########
    stag_top = flat_height;
    stag_group = draw.group();
    stag_edge_group = stag_group.group();
    stag_num_group = stag_group.group().after(stag_edge_group);
    stag_rect_group = stag_group.group().before(stag_num_group);
    stag_nums = (function() {
      var len1, o, results;
      results = [];
      for (o = 0, len1 = A.length; o < len1; o++) {
        v = A[o];
        results.push(null);
      }
      return results;
    })();
    for (i = o = 0, len1 = A.length; o < len1; i = ++o) {
      v = A[i];
      g = stag_num_group.group();
      color = in_colors[i];
      tc = g.rect(bbox.width, bbox.height).fill(color);
      tt = g.text("" + v).center(tc.cx(), tc.cy());
      stag_nums[i] = g;
    }
    stag_rects = (function() {
      var len2, q, results;
      results = [];
      for (q = 0, len2 = A.length; q < len2; q++) {
        v = A[q];
        results.push(stag_rect_group.rect(bbox.width, bbox.height));
      }
      return results;
    })();
    stag_edges = (function() {
      var len2, q, results;
      results = [];
      for (q = 0, len2 = A.length; q < len2; q++) {
        v = A[q];
        results.push(null);
      }
      return results;
    })();
    for (i = q = 0, len2 = A.length; q < len2; i = ++q) {
      v = A[i];
      color = in_colors[i];
      snum = stag_nums[i];
      srect = stag_rects[i];
      sx = bbox.width * i;
      sy = stag_top + index_depth(i) * 1.75 * bbox.height;
      srect.move(sx, sy).fill({
        opacity: 0
      }).stroke('#fff');
      snum.center(srect.cx(), srect.cy());
      if (i > 0) {
        p = parent_index(i);
        prect = stag_rects[p];
        stag_edges[i] = stag_edge_group.line(srect.cx(), srect.cy(), prect.cx(), prect.cy()).stroke({
          color: '#888',
          width: 1 //.hide()
        });
      }
    }
    stag_height = (1 + 1.75 * index_depth(A.length - 1)) * bbox.height;
    //####### tree graphics ########
    tree_top = stag_top + stag_height + 8;
    tree_group = draw.group();
    tree_edge_group = tree_group.group();
    tree_circle_group = tree_group.group();
    tree_num_group = tree_group.group();
    cbox = {
      width: Math.floor((bbox.width * 3) / 2),
      height: Math.floor((bbox.height * 3) / 2)
    };
    tree_nums = (function() {
      var len3, results, s;
      results = [];
      for (s = 0, len3 = A.length; s < len3; s++) {
        v = A[s];
        results.push(null);
      }
      return results;
    })();
    for (i = s = 0, len3 = A.length; s < len3; i = ++s) {
      v = A[i];
      g = tree_num_group.group();
      color = in_colors[i];
      tc = g.circle(cbox.width, cbox.height).fill(color);
      tt = g.text("" + v).center(tc.cx(), tc.cy());
      tree_nums[i] = g;
    }
    tree_circles = (function() {
      var len4, results, u;
      results = [];
      for (u = 0, len4 = A.length; u < len4; u++) {
        v = A[u];
        results.push(tree_circle_group.circle(cbox.width, cbox.height));
      }
      return results;
    })();
    tree_edges = (function() {
      var len4, results, u;
      results = [];
      for (u = 0, len4 = A.length; u < len4; u++) {
        v = A[u];
        results.push(null);
      }
      return results;
    })();
    // position tree elements
    tree_levels = (function() {
      var ref1, results, u;
      results = [];
      for (d = u = 0, ref1 = tree_height; (0 <= ref1 ? u <= ref1 : u >= ref1); d = 0 <= ref1 ? ++u : --u) {
        results.push([]);
      }
      return results;
    })();
    for (i = u = 0, ref1 = A.length; (0 <= ref1 ? u < ref1 : u > ref1); i = 0 <= ref1 ? ++u : --u) {
      tree_levels[index_depth(i)].push(i);
    }
    for (d = w = 0, len4 = tree_levels.length; w < len4; d = ++w) {
      level = tree_levels[d];
      h = tree_height - d + 1; //index_height(i, A.length)
      x_offset = Math.pow(2, h - 2) * (8 + cbox.width);
      x_spacing = Math.pow(2, h - 1) * (8 + cbox.width);
      for (li = x = 0, len5 = level.length; x < len5; li = ++x) {
        i = level[li];
        tnum = tree_nums[i];
        tcirc = tree_circles[i];
        // place tree node
        tx = x_offset + li * x_spacing;
        ty = tree_top + d * cbox.height;
        tcirc.fill({
          opacity: 0
        }).stroke({
          opacity: 0 //('#fff')
        }).move(tx, ty);
        tnum.center(tcirc.cx(), tcirc.cy());
        // place parent edge
        if (i > 0) {
          p = parent_index(i);
          pcirc = tree_circles[p];
          tree_edges[i] = tree_edge_group.line(pcirc.cx(), pcirc.cy(), tcirc.cx(), tcirc.cy()).stroke('#888').hide();
        }
      }
    }
    tree_bot = tree_top + (tree_height + 1) * cbox.height;
    // create pointers
    ptrs = init_pointers(draw, bbox, cbox);
    // set the viewbox to be just the matrix
    spacing = 3;
    view_height = tree_bot;
    draw.viewbox({
      x: -4,
      y: -4,
      width: 8 + bbox.width * (1 + A.length),
      height: 8 + view_height
    });
    draw.size(12 + bbox.width * A.length, 12 + view_height);
    return {
      // return info
      bbox: bbox,
      cbox: cbox,
      ptrs: ptrs,
      in_colors: in_colors,
      tree_path: [],
      heap_size: 0,
      heap: (function() {
        var ref2, results, y;
        results = [];
        for (i = y = 0, ref2 = A.length; (0 <= ref2 ? y < ref2 : y > ref2); i = 0 <= ref2 ? ++y : --y) {
          results.push({
            value: A[i],
            cell: {
              num: array_nums[i],
              rect: array_rects[i]
            },
            stag: {
              num: stag_nums[i],
              rect: stag_rects[i],
              parent_edge: stag_edges[i]
            },
            node: {
              num: tree_nums[i],
              circle: tree_circles[i],
              parent_edge: tree_edges[i]
            }
          });
        }
        return results;
      })()
    };
  };

  init_pointers = function(draw, bbox, cbox) {
    var cell_ptrs, make_cell_ptr, make_node_ptr, make_stag_ptr, node_ptrs, stag_ptrs;
    // make ptrs into cells of array
    make_cell_ptr = function(label, below = false) {
      var g, r, t, toffset;
      g = draw.group();
      r = g.rect(bbox.width, bbox.height).fill({
        opacity: 0
      }).stroke('#000').move(0, bbox.height);
      toffset = bbox.height * (below ? 1 : -1);
      t = g.text(label).font({
        family: "Monospace",
        size: 20
      }).center(r.cx(), r.cy() + toffset);
      g.hide();
      return g;
    };
    cell_ptrs = {
      i: make_cell_ptr("i"),
      r: make_cell_ptr("r"),
      l: make_cell_ptr("l"),
      p: make_cell_ptr("p"),
      n: make_cell_ptr("n", true)
    };
    // make ptrs for staggered array
    make_stag_ptr = function(label) {
      var r;
      r = draw.rect(bbox.width, bbox.height).fill({
        opacity: 0
      }).stroke({
        color: '#000',
        width: (label === "i" ? 4 : 2)
      }).move(0, bbox.height);
      r.hide();
      return r;
    };
    stag_ptrs = {
      i: make_stag_ptr("i"),
      r: make_stag_ptr("r"),
      l: make_stag_ptr("l"),
      p: make_stag_ptr("p"),
      n: make_stag_ptr("n")
    };
    // make ptrs into nodes of tree
    make_node_ptr = function(label) {
      var c;
      c = draw.circle(cbox.width, cbox.height).fill({
        opacity: 0
      }).stroke({
        color: '#000',
        width: (label === "i" ? 4 : 2)
      });
      c.hide();
      return c;
    };
    node_ptrs = {
      i: make_node_ptr("i"),
      r: make_node_ptr("r"),
      l: make_node_ptr("l"),
      p: make_node_ptr("p")
    };
    return {
      cell: cell_ptrs,
      stag: stag_ptrs,
      node: node_ptrs
    };
  };

  dur_index = 0;

  durations = [
    {
      swap: 1000,
      ptr: 600,
      name: "1x Speed"
    },
    {
      swap: 500,
      ptr: 300,
      name: "2x Speed"
    },
    {
      swap: 200,
      ptr: 50,
      name: "5x Speed"
    },
    {
      swap: 50,
      ptr: 10,
      name: "20x Speed"
    }
  ];

  window.toggle_turbo = function() {
    dur_index = (dur_index + 1) % durations.length;
    return document.getElementById("turbo-button").innerHTML = durations[dur_index].name;
  };

  add_to_tree_path = function(draw, info, i) {
    info.tree_path.push(i);
    return info.heap[i].node.circle.stroke({
      color: '#444',
      opacity: 1,
      width: 5
    });
  };

  clear_tree_path = function(info) {
    var i, k, len, ref;
    ref = info.tree_path;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      info.heap[i].node.circle.stroke({
        opacity: 0
      });
    }
    return info.tree_path = [];
  };

  anim_or_appear = function(obj, dur) {
    if (obj.visible()) {
      return obj.animate(dur);
    } else {
      return obj.show();
    }
  };

  do_step = function(draw, info, step) {
    var color_edges, color_parent_edge, dur, ei, ej, hide_ptr, i, k, m, put_ptr, ref, ref1, ref2, ref3;
    // define convenience functions
    put_ptr = function(name) {
      var dur, elem;
      dur = durations[dur_index].ptr;
      // flat array
      anim_or_appear(info.ptrs.cell[name], dur).x(step.to[name] * info.bbox.width);
      // staggered array
      if (step.to[name] < info.heap.length) {
        elem = info.heap[step.to[name]].stag.rect;
        anim_or_appear(info.ptrs.stag[name], dur).move(elem.x(), elem.y());
      }
      // tree
      elem = info.heap[step.to[name]].node.circle;
      return anim_or_appear(info.ptrs.node[name], dur).move(elem.x(), elem.y());
    };
    hide_ptr = function(name) {
      info.ptrs.cell[name].hide();
      info.ptrs.stag[name].hide();
      return info.ptrs.node[name].hide();
    };
    color_parent_edge = function(p, i) {
      var ei, ep;
      if (i !== p) {
        ei = info.heap[i];
        ei.stag.parent_edge.stroke({
          color: '#888',
          width: 1
        });
        if (i < info.heap_size) {
          ep = info.heap[p];
          ei.node.parent_edge.show();
          if (ei.value > ep.value) { // violates heap property
            ei.node.parent_edge.stroke({
              color: '#f00',
              width: 4
            });
            return ei.stag.parent_edge.stroke({
              color: '#f00',
              width: 4 // satisfies heap property
            });
          } else {
            return ei.node.parent_edge.stroke({
              color: '#888',
              width: 1
            });
          }
        } else {
          return ei.node.parent_edge.hide();
        }
      }
    };
    color_edges = function(i) {
      var l, p, r;
      [p, l, r] = [parent_index(i), left_index(i, info.heap_size), right_index(i, info.heap_size)];
      color_parent_edge(p, i);
      color_parent_edge(i, l);
      return color_parent_edge(i, r);
    };
    switch (step.act) {
      case Act.none:
        true;
        break;
      case Act.set_n:
        info.heap_size = step.to;
        anim_or_appear(info.ptrs.cell.n, durations[dur_index].ptr).x(step.to * info.bbox.width);
        if (step.to > step.from) { // increase
          for (i = k = ref = step.from, ref1 = step.to; (ref <= ref1 ? k < ref1 : k > ref1); i = ref <= ref1 ? ++k : --k) {
            color_edges(i); // decrease
          }
        } else {
          for (i = m = ref2 = step.to, ref3 = step.from; (ref2 <= ref3 ? m < ref3 : m > ref3); i = ref2 <= ref3 ? ++m : --m) {
            color_edges(i);
          }
        }
        break;
      case Act.set_mhd:
        if (step.to != null) {
          put_ptr("i");
          add_to_tree_path(draw, info, step.to.i);
          if (step.to.l === step.to.i) {
            hide_ptr("l");
            hide_ptr("r");
          } else {
            put_ptr("l");
            if (step.to.r === step.to.i) {
              hide_ptr("r");
            } else {
              put_ptr("r");
            }
          }
        } else {
          hide_ptr("i");
          hide_ptr("l");
          hide_ptr("r");
        }
        break;
      case Act.set_mhu: // (i:i,p:p)
        if (step.to != null) {
          put_ptr("i");
          add_to_tree_path(draw, info, step.to.i);
          if (step.to.p === step.to.i) {
            hide_ptr("p");
          } else {
            put_ptr("p");
          }
        } else {
          hide_ptr("i");
          hide_ptr("p");
        }
        break;
      case Act.swap:
        ei = info.heap[step.i];
        ej = info.heap[step.j];
        dur = durations[dur_index].swap;
        // swap in array
        ei.cell.num.animate(dur).center(ej.cell.rect.cx(), ej.cell.rect.cy());
        ej.cell.num.animate(dur).center(ei.cell.rect.cx(), ei.cell.rect.cy());
        ei.cell.rect.animate(dur).fill(info.in_colors[step.j]);
        ej.cell.rect.animate(dur).fill(info.in_colors[step.i]);
        // swap in staggered array
        ei.stag.num.animate(dur).center(ej.stag.rect.cx(), ej.stag.rect.cy());
        ej.stag.num.animate(dur).center(ei.stag.rect.cx(), ei.stag.rect.cy());
        // swap in tree
        ei.node.num.animate(dur).center(ej.node.circle.cx(), ej.node.circle.cy());
        ej.node.num.animate(dur).center(ei.node.circle.cx(), ei.node.circle.cy());
        ei.node.circle.animate(dur).fill(info.in_colors[step.j]);
        ej.node.circle.animate(dur).fill(info.in_colors[step.i]);
        // swap in info
        [ei.value, ej.value] = [ej.value, ei.value];
        [ei.cell.num, ej.cell.num] = [ej.cell.num, ei.cell.num];
        [ei.stag.num, ej.stag.num] = [ej.stag.num, ei.stag.num];
        [ei.node.num, ej.node.num] = [ej.node.num, ei.node.num];
        [info.in_colors[step.i], info.in_colors[step.j]] = [info.in_colors[step.j], info.in_colors[step.i]];
        color_edges(step.i);
        color_edges(step.j);
        break;
      case Act.clear_path:
        clear_tree_path(info);
    }
    return true;
  };

  // autorun controls
  autorun = 0;

  autorun_dur = function() {
    return Math.max(durations[dur_index].swap, durations[dur_index].ptr);
  };

  buttons_edit_playing = function() {
    document.getElementById("play-button").innerHTML = "Pause";
    return document.getElementById("next-button").disabled = "true";
  };

  buttons_edit_stopped = function() {
    document.getElementById("play-button").innerHTML = "Play";
    return document.getElementById("next-button").disabled = null;
  };

  // start/stop play
  window.click_play = function() {
    switch (autorun) {
      case 0: // paused
        autorun = 1;
        buttons_edit_playing();
        return autorun_loop();
      case 1: // already playing
        return autorun = 0;
    }
  };

  // loop
  autorun_loop = function() {
    var dur;
    dur = autorun_dur();
    if (autorun === 1 && window.click_next()) {
      buttons_edit_playing();
      state.draw.animate({
        duration: dur
      }).after(function() {
        return autorun_loop();
      });
    } else if (autorun === 0) {
      buttons_edit_stopped();
    }
    return true;
  };

  set_cmd_buttons_usable = function(can_press) {
    var value;
    value = (can_press ? null : "true");
    document.getElementById("cmd-full-size").disabled = value;
    document.getElementById("cmd-mhu").disabled = value;
    document.getElementById("cmd-sort").disabled = value;
    document.getElementById("cmd-build").disabled = value;
    document.getElementById("cmd-rmv").disabled = value;
    return document.getElementById("cmd-ins").disabled = value;
  };

  window.click_next = function() {
    var next;
    if (state.gen != null) {
      next = state.gen.next();
      if (next.done) {
        state.gen = null;
        set_cmd_buttons_usable(true);
      } else {
        do_step(state.draw, state.info, next.value);
        document.getElementById("msg").innerHTML = next.value.msg;
        set_cmd_buttons_usable(false);
      }
      return true;
    } else {
      return false;
    }
  };

  window.click_extract_max = function() {
    if (state.gen != null) {
      return true; // another operation is on-going
    } else {
      clear_tree_path(state.info);
      state.gen = heap_extract_max(state.A, state.info.heap_size);
      autorun = 1;
      return autorun_loop(); //window.click_next()
    }
  };

  window.click_insert = function() {
    if (state.gen != null) {
      return true; // another operation is on-going
    } else {
      clear_tree_path(state.info);
      state.gen = heap_insert(state.A, state.info.heap_size);
      autorun = 1;
      return autorun_loop(); //window.click_next()
    }
  };

  window.click_full_size = function() {
    var generator;
    if (state.gen != null) {
      return true; // another operation is on-going
    } else {
      generator = function*() {
        return (yield {
          act: Act.set_n,
          from: state.info.heap_size,
          to: state.A.length,
          msg: "Making heap contain full array."
        });
      };
      clear_tree_path(state.info);
      state.gen = generator();
      autorun = 1;
      return autorun_loop(); //window.click_next()
    }
  };

  window.click_max_heapify_down = function() {
    var i, input;
    input = document.getElementById("trickle-index").value;
    i = Math.abs(input);
    if ("number" === typeof i && 0 <= i && i < state.info.heap_size) {
      if (state.gen != null) {
        return true;
      } else {
        clear_tree_path(state.info);
        state.gen = max_heapify_down(state.A, state.info.heap_size, i, null);
        autorun = 1;
        return autorun_loop(); // another operation is ongoing
      }
    }
  };

  window.click_heap_sort = function() {
    if (state.gen != null) {
      return true;
    } else {
      clear_tree_path(state.info);
      state.gen = heap_sort(state.A);
      autorun = 1;
      return autorun_loop(); // another operation is ongoing
    }
  };

  window.click_build_heap = function() {
    if (state.gen != null) {
      return true;
    } else {
      clear_tree_path(state.info);
      state.gen = build_heap(state.A);
      autorun = 1;
      return autorun_loop(); // another operation is ongoing
    }
  };

  main = function() {
    state.draw = SVG('drawing');
    state.info = init_draw(state.draw, state.A);
    return state.gen = null;
  };

  SVG.on(document, 'DOMContentLoaded', main);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLEdBQUEsRUFBQSxLQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsT0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxvQkFBQSxFQUFBLG9CQUFBLEVBQUEsZUFBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLGdCQUFBLEVBQUEsV0FBQSxFQUFBLFNBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLFdBQUEsRUFBQSxzQkFBQSxFQUFBLEtBQUEsRUFBQTs7RUFBQSxLQUFBLEdBQ0U7SUFBQSxDQUFBLEVBQUcsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLEVBQVAsRUFBVyxFQUFYLEVBQWUsQ0FBZixFQUFrQixDQUFsQixFQUFxQixFQUFyQixFQUF5QixFQUF6QixFQUE2QixFQUE3QixFQUFpQyxFQUFqQyxFQUFxQyxFQUFyQyxFQUF5QyxDQUF6QyxFQUE0QyxFQUE1QyxFQUFnRCxDQUFoRCxFQUFtRCxDQUFuRCxFQUFzRCxDQUF0RCxFQUF5RCxFQUF6RCxFQUE2RCxDQUE3RCxFQUFnRSxFQUFoRSxFQUFvRSxFQUFwRSxFQUF3RSxFQUF4RSxFQUE0RSxFQUE1RSxFQUFnRixFQUFoRixFQUFvRixDQUFwRixFQUF1RixFQUF2RixFQUEyRixFQUEzRixFQUErRixFQUEvRixFQUFtRyxFQUFuRyxFQUF1RyxFQUF2RyxFQUEyRyxFQUEzRyxFQUErRyxFQUEvRztFQUFIOztFQUVGLFlBQUEsR0FBZSxRQUFBLENBQUMsQ0FBRCxDQUFBO0FBQ2YsUUFBQTtJQUFFLENBQUEsY0FBSSxDQUFDLENBQUEsR0FBSSxDQUFMLElBQVc7QUFDZixXQUFPLENBQUksQ0FBQSxHQUFJLENBQVAsR0FBYyxDQUFkLEdBQXFCLENBQXRCO0VBRk07O0VBR2YsVUFBQSxHQUFhLFFBQUEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFBO0FBQ2IsUUFBQTtJQUFFLENBQUEsR0FBSSxDQUFBLEdBQUksQ0FBSixHQUFRO0FBQ1osV0FBTyxDQUFJLENBQUEsR0FBSSxDQUFQLEdBQWMsQ0FBZCxHQUFxQixDQUF0QjtFQUZJOztFQUdiLFdBQUEsR0FBYyxRQUFBLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBQTtBQUNkLFFBQUE7SUFBRSxDQUFBLEdBQUksQ0FBQSxHQUFJLENBQUosR0FBUTtBQUNaLFdBQU8sQ0FBSSxDQUFBLEdBQUksQ0FBUCxHQUFjLENBQWQsR0FBcUIsQ0FBdEI7RUFGSzs7RUFHZCxXQUFBLEdBQWMsUUFBQSxDQUFDLENBQUQsQ0FBQTtJQUNaLElBQUcsQ0FBQSxLQUFLLENBQVI7YUFBZSxFQUFmO0tBQUEsTUFBQTthQUFzQixDQUFBLEdBQUksV0FBQSxDQUFZLFlBQUEsQ0FBYSxDQUFiLENBQVosRUFBMUI7O0VBRFk7O0VBRWQsWUFBQSxHQUFlLFFBQUEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFBO0FBQ2YsUUFBQTtJQUFFLENBQUEsR0FBSSxVQUFBLENBQVcsQ0FBWCxFQUFhLENBQWI7QUFDSixXQUFPLENBQUksQ0FBQSxLQUFLLENBQVIsR0FBZSxDQUFmLEdBQXNCLENBQUEsR0FBSSxZQUFBLENBQWEsQ0FBYixFQUFlLENBQWYsQ0FBM0I7RUFGTTs7RUFJZixHQUFBLEdBQU87SUFBQSxJQUFBLEVBQUssQ0FBTDtJQUFPLElBQUEsRUFBSyxDQUFaO0lBQWMsS0FBQSxFQUFNLENBQXBCO0lBQXNCLE9BQUEsRUFBUSxDQUE5QjtJQUFnQyxPQUFBLEVBQVEsQ0FBeEM7SUFBMEMsVUFBQSxFQUFXO0VBQXJEOztFQUVQLFlBQUEsR0FBZSxTQUFBLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBQUE7SUFDYixNQUFPLENBQUE7TUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLElBQVI7TUFBYyxDQUFBLEVBQUUsQ0FBaEI7TUFBbUIsQ0FBQSxFQUFFLENBQXJCO01BQXdCLEdBQUEsRUFBSSxDQUFBLE9BQUEsQ0FBQSxDQUFVLENBQVYsQ0FBQSxLQUFBLENBQUEsQ0FBbUIsQ0FBbkIsQ0FBQSxDQUFBO0lBQTVCLENBQUE7V0FDUCxDQUFDLENBQUMsQ0FBQyxDQUFELENBQUYsRUFBTSxDQUFDLENBQUMsQ0FBRCxDQUFQLENBQUEsR0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFELENBQUYsRUFBTSxDQUFDLENBQUMsQ0FBRCxDQUFQO0VBRkQ7O0VBSWYsZ0JBQUEsR0FBbUIsU0FBQSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLElBQVYsQ0FBQSxFQUFBO0FBQ25CLFFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7SUFBRSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUEsR0FBUztNQUFDLFVBQUEsQ0FBVyxDQUFYO01BQWMsQ0FBZCxDQUFEO01BQW1CLFdBQUEsQ0FBWSxDQUFaO01BQWUsQ0FBZixDQUFuQjs7SUFDVCxDQUFBLEdBQUksQ0FBSSxDQUFDLENBQUMsQ0FBRCxDQUFELEdBQU8sQ0FBQyxDQUFDLENBQUQsQ0FBWCxHQUFvQixDQUFwQixHQUEyQixDQUE1QixFQUROO0lBRUUsRUFBQSxHQUFNO01BQUEsQ0FBQSxFQUFFLENBQUY7TUFBSSxDQUFBLEVBQUUsQ0FBTjtNQUFRLENBQUEsRUFBRSxDQUFWO01BQVksQ0FBQSxFQUFFO0lBQWQ7SUFDTixNQUFPLENBQUE7TUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLE9BQVI7TUFBaUIsSUFBQSxFQUFLLElBQXRCO01BQTRCLEVBQUEsRUFBRyxFQUEvQjtNQUFtQyxHQUFBLEVBQUksQ0FBQSwyQkFBQSxDQUFBLENBQThCLENBQTlCLENBQUEsSUFBQSxDQUFBLENBQXNDLENBQUMsQ0FBQyxDQUFELENBQXZDLENBQUE7SUFBdkMsQ0FBQTtJQUNQLElBQUcsQ0FBQyxDQUFDLENBQUQsQ0FBRCxHQUFPLENBQUMsQ0FBQyxDQUFELENBQVg7TUFDRSxPQUFXLFlBQUEsQ0FBYSxDQUFiLEVBQWUsQ0FBZixFQUFpQixDQUFqQixFQUFmO2FBQ0ksQ0FBQSxPQUFXLGdCQUFBLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLENBQXZCLEVBQTBCLEVBQTFCLENBQVgsRUFGRjtLQUFBLE1BQUE7YUFJRSxDQUFBLE1BQU87UUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLE9BQVI7UUFBaUIsSUFBQSxFQUFLLEVBQXRCO1FBQTBCLEVBQUEsRUFBRyxJQUE3QjtRQUFtQyxHQUFBLEVBQUk7TUFBdkMsQ0FBUCxFQUpGOztFQUxpQjs7RUFXbkIsY0FBQSxHQUFpQixTQUFBLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsSUFBVixDQUFBLEVBQUE7QUFDakIsUUFBQSxDQUFBLEVBQUE7SUFBRSxDQUFBLEdBQUksWUFBQSxDQUFhLENBQWIsRUFBTjtJQUNFLEVBQUEsR0FBTTtNQUFBLENBQUEsRUFBRSxDQUFGO01BQUksQ0FBQSxFQUFFO0lBQU47SUFDTixNQUFPLENBQUE7TUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLE9BQVI7TUFBaUIsSUFBQSxFQUFLLElBQXRCO01BQTRCLEVBQUEsRUFBRyxFQUEvQjtNQUFtQyxHQUFBLEVBQUksQ0FBQSx5QkFBQSxDQUFBLENBQTRCLENBQTVCLENBQUEsSUFBQSxDQUFBLENBQW9DLENBQUMsQ0FBQyxDQUFELENBQXJDLENBQUE7SUFBdkMsQ0FBQTtJQUNQLElBQUcsQ0FBQyxDQUFDLENBQUQsQ0FBRCxHQUFPLENBQUMsQ0FBQyxDQUFELENBQVg7TUFDRSxPQUFXLFlBQUEsQ0FBYSxDQUFiLEVBQWUsQ0FBZixFQUFpQixDQUFqQixFQUFmO2FBQ0ksQ0FBQSxPQUFXLGNBQUEsQ0FBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLElBQXhCLENBQVgsRUFGRjtLQUFBLE1BQUE7YUFJRSxDQUFBLE1BQU87UUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLE9BQVI7UUFBaUIsSUFBQSxFQUFLLEVBQXRCO1FBQTBCLEVBQUEsRUFBRyxJQUE3QjtRQUFtQyxHQUFBLEVBQUk7TUFBdkMsQ0FBUCxFQUpGOztFQUplOztFQVVqQixXQUFBLEdBQWMsU0FBQSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUEsRUFBQTtBQUNkLFFBQUE7SUFBRSxJQUFHLENBQUEsR0FBSSxDQUFDLENBQUMsTUFBVDtNQUNFLEtBQUEsR0FBUSxDQUFBLEdBQUk7TUFDWixNQUFPLENBQUE7UUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLEtBQVI7UUFBZSxJQUFBLEVBQUssQ0FBcEI7UUFBdUIsRUFBQSxFQUFHLEtBQTFCO1FBQWlDLEdBQUEsRUFBSSxDQUFBLFlBQUEsQ0FBQSxDQUFlLENBQWYsQ0FBQSxJQUFBLENBQUEsQ0FBdUIsS0FBdkIsQ0FBQTtNQUFyQyxDQUFBO2FBQ1AsQ0FBQSxPQUFXLGNBQUEsQ0FBZSxDQUFmLEVBQWtCLEtBQWxCLEVBQXlCLENBQXpCLEVBQTRCLElBQTVCLENBQVgsRUFIRjs7RUFEWTs7RUFNZCxnQkFBQSxHQUFtQixTQUFBLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBQSxFQUFBO0FBQ25CLFFBQUE7SUFBRSxJQUFHLENBQUEsR0FBSSxDQUFQO01BQ0UsS0FBQSxHQUFRLENBQUEsR0FBSTtNQUNaLE1BQU8sQ0FBQTtRQUFBLEdBQUEsRUFBSSxHQUFHLENBQUMsS0FBUjtRQUFlLElBQUEsRUFBSyxDQUFwQjtRQUF1QixFQUFBLEVBQUcsS0FBMUI7UUFBaUMsR0FBQSxFQUFJLENBQUEsWUFBQSxDQUFBLENBQWUsQ0FBZixDQUFBLElBQUEsQ0FBQSxDQUF1QixLQUF2QixDQUFBO01BQXJDLENBQUE7TUFDUCxPQUFXLFlBQUEsQ0FBYSxDQUFiLEVBQWUsQ0FBZixFQUFpQixLQUFqQjthQUNYLENBQUEsT0FBVyxnQkFBQSxDQUFpQixDQUFqQixFQUFvQixLQUFwQixFQUEyQixDQUEzQixFQUE4QixJQUE5QixDQUFYLEVBSkY7O0VBRGlCOztFQU9uQixVQUFBLEdBQWEsU0FBQSxDQUFDLENBQUQsQ0FBQTtBQUNiLFFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBO0lBQUUsQ0FBQSxHQUFJLENBQUMsQ0FBQztJQUNOLElBQUcsQ0FBQSxHQUFJLENBQVA7TUFDRSxNQUFPLENBQUE7UUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLEtBQVI7UUFBZSxJQUFBLEVBQUssQ0FBcEI7UUFBdUIsRUFBQSxFQUFHLENBQTFCO1FBQTZCLEdBQUEsRUFBSSxDQUFBLFdBQUEsQ0FBQSxDQUFjLENBQWQsQ0FBQSxTQUFBO01BQWpDLENBQUEsRUFBWDs7QUFDSTtNQUFBLEtBQVMsNkZBQVQ7UUFDRSxPQUFXLGdCQUFBLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLENBQXZCLEVBQWpCO3FCQUNNLENBQUEsTUFBTztVQUFBLEdBQUEsRUFBSSxHQUFHLENBQUMsVUFBUjtVQUFvQixHQUFBLEVBQUk7UUFBeEIsQ0FBUDtNQUZGLENBQUE7cUJBRkY7O0VBRlc7O0VBUWIsU0FBQSxHQUFZLFNBQUEsQ0FBQyxDQUFELENBQUE7QUFDWixRQUFBLENBQUEsRUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQTtJQUFFLEtBQUEsR0FBUSxDQUFDLENBQUM7SUFDVixJQUFHLEtBQUEsR0FBUSxDQUFYO01BQ0UsT0FBVyxVQUFBLENBQVcsQ0FBWCxFQUFmOztBQUNJO01BQUEsS0FBUyx5RUFBVDtRQUNFLE9BQVcsZ0JBQUEsQ0FBaUIsQ0FBakIsRUFBbUIsQ0FBbkIsRUFBakI7cUJBQ00sQ0FBQSxNQUFPO1VBQUEsR0FBQSxFQUFJLEdBQUcsQ0FBQyxVQUFSO1VBQW9CLEdBQUEsRUFBSTtRQUF4QixDQUFQO01BRkYsQ0FBQTtxQkFGRjs7RUFGVSxFQWxFWjs7O0VBMkVBLFlBQUEsR0FBZSxRQUFBLENBQUMsQ0FBRCxDQUFBO0FBQ2YsUUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUE7SUFBRSxJQUFBLEdBQVE7TUFBQSxLQUFBLEVBQU0sQ0FBTjtNQUFTLE1BQUEsRUFBTztJQUFoQjtJQUNSLEtBQUEsbUNBQUE7O01BQ0UsSUFBQSxHQUFPLENBQUMsQ0FBQyxJQUFGLENBQUE7TUFDUCxJQUFJLENBQUMsS0FBTCxHQUFhLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBSSxDQUFDLEtBQWQsRUFBcUIsSUFBSSxDQUFDLEtBQTFCO01BQ2IsSUFBSSxDQUFDLE1BQUwsR0FBYyxJQUFJLENBQUMsR0FBTCxDQUFTLElBQUksQ0FBQyxNQUFkLEVBQXNCLElBQUksQ0FBQyxNQUEzQjtJQUhoQjtBQUlBLFdBQU87RUFOTTs7RUFRZixHQUFBLEdBQU0sUUFBQSxDQUFDLENBQUQsQ0FBQTtBQUFPLFdBQU8sQ0FBQyxDQUFDLE1BQUYsQ0FBUyxRQUFBLENBQUMsQ0FBRCxFQUFHLENBQUgsQ0FBQTthQUFTLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFXLENBQVg7SUFBVCxDQUFUO0VBQWQ7O0VBQ04sS0FBQSxHQUFRLEdBQUcsQ0FBQyxPQUFPLENBQUM7O0VBRXBCLFNBQUEsR0FBWSxRQUFBLENBQUMsSUFBRCxFQUFPLENBQVAsQ0FBQTtBQUNaLFFBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxXQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxXQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsU0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLENBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLFVBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsZUFBQSxFQUFBLFVBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxTQUFBLEVBQUEsZUFBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxRQUFBLEVBQUEsaUJBQUEsRUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLFVBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLFdBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLFFBQUEsRUFBQTtJQUFFLFdBQUEsR0FBYyxXQUFBLENBQVksQ0FBQyxDQUFDLE1BQUYsR0FBUyxDQUFyQixFQUFoQjs7SUFFRSxXQUFBLEdBQWMsSUFBSSxDQUFDLEtBQUwsQ0FBQTtJQUNkLFVBQUEsR0FBYSxXQUFXLENBQUMsS0FBWixDQUFBO0lBQ2IsU0FBQSxHQUFZLFdBQVcsQ0FBQyxLQUFaLENBQUE7SUFDWixXQUFBLEdBQWMsV0FBVyxDQUFDLEtBQVosQ0FBQSxFQUxoQjs7SUFPRSxVQUFBOztBQUFjO01BQUEsS0FBQSxtQ0FBQTs7cUJBQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxFQUFBLEdBQUssQ0FBcEI7TUFBQSxDQUFBOztTQVBoQjs7SUFTRSxJQUFBLEdBQU8sWUFBQSxDQUFhLFVBQWI7SUFDUCxNQUFBLEdBQVM7SUFDVCxJQUFJLENBQUMsS0FBTCxJQUFjO0lBQ2QsSUFBSSxDQUFDLE1BQUwsSUFBZSxPQVpqQjs7SUFjRSxXQUFBOztBQUFlO01BQUEsS0FBQSxtQ0FBQTs7cUJBQUEsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsSUFBSSxDQUFDLEtBQXJCLEVBQTRCLElBQUksQ0FBQyxNQUFqQztNQUFBLENBQUE7O1NBZGpCOztJQWdCRSxHQUFBLEdBQU0sS0FBQSxDQUFNO01BQUEsR0FBQSxFQUFLLENBQUw7TUFBUSxVQUFBLEVBQVksQ0FBcEI7TUFBdUIsS0FBQSxFQUFPO0lBQTlCLENBQU47SUFDTixTQUFBOztBQUFhO01BQUEsS0FBQSxtQ0FBQTs7cUJBQUEsR0FBRyxDQUFDLFFBQUosQ0FBYSxDQUFBLEdBQUUsRUFBZixDQUFrQixDQUFDLGNBQW5CLENBQWtDLElBQWxDLENBQXVDLENBQUMsS0FBeEMsQ0FBQTtNQUFBLENBQUE7O1NBakJmOztJQW1CRSxLQUFBLDJDQUFBOztNQUNFLEtBQUEsR0FBUSxTQUFTLENBQUMsQ0FBRDtNQUNqQixJQUFBLEdBQU8sVUFBVSxDQUFDLENBQUQ7TUFDakIsS0FBQSxHQUFRLFdBQVcsQ0FBQyxDQUFELEVBRnZCOztNQUlJLEVBQUEsR0FBSyxJQUFJLENBQUMsS0FBTCxHQUFhO01BQ2xCLEVBQUEsR0FBSyxJQUFJLENBQUM7TUFDVixLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsQ0FDSyxDQUFDLE1BRE4sQ0FDYSxNQURiLENBRUssQ0FBQyxJQUZOLENBRVcsRUFGWCxFQUVlLEVBRmY7TUFHQSxJQUFJLENBQUMsTUFBTCxDQUFZLEtBQUssQ0FBQyxFQUFOLENBQUEsQ0FBWixFQUF3QixLQUFLLENBQUMsRUFBTixDQUFBLENBQXhCO0lBVkYsQ0FuQkY7O0lBK0JFLFdBQUEsR0FBYztJQUNkLEtBQVMsd0ZBQVQ7TUFDRSxHQUFBLEdBQU0sSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVcsQ0FBWCxDQUFBLEdBQWdCLElBQUksQ0FBQztNQUMzQixFQUFBLEdBQUssR0FBQSxHQUFNLElBQUksQ0FBQztNQUNoQixFQUFBLEdBQUssQ0FBQSxHQUFFLElBQUksQ0FBQyxNQUFQLEdBQWdCO01BQ3JCLElBQUEsR0FBTyxXQUFXLENBQUMsSUFBWixDQUFpQixFQUFBLEdBQUcsQ0FBcEIsRUFBc0IsRUFBdEIsRUFBeUIsRUFBQSxHQUFHLEdBQUgsR0FBTyxDQUFoQyxFQUFrQyxFQUFsQyxDQUFxQyxDQUFDLE1BQXRDLENBQTZDO1FBQUEsS0FBQSxFQUFNLE1BQU47UUFBYSxLQUFBLEVBQU07TUFBbkIsQ0FBN0M7TUFDUCxXQUFXLENBQUMsSUFBWixDQUFpQixJQUFqQjtJQUxGO0lBTUEsV0FBQSxHQUFjLENBQUEsR0FBSSxJQUFJLENBQUMsT0F0Q3pCOztJQXdDRSxRQUFBLEdBQVc7SUFDWCxVQUFBLEdBQWEsSUFBSSxDQUFDLEtBQUwsQ0FBQTtJQUNiLGVBQUEsR0FBa0IsVUFBVSxDQUFDLEtBQVgsQ0FBQTtJQUNsQixjQUFBLEdBQWlCLFVBQVUsQ0FBQyxLQUFYLENBQUEsQ0FBa0IsQ0FBQyxLQUFuQixDQUF5QixlQUF6QjtJQUNqQixlQUFBLEdBQWtCLFVBQVUsQ0FBQyxLQUFYLENBQUEsQ0FBa0IsQ0FBQyxNQUFuQixDQUEwQixjQUExQjtJQUNsQixTQUFBOztBQUFhO01BQUEsS0FBQSxxQ0FBQTs7cUJBQUE7TUFBQSxDQUFBOzs7SUFDYixLQUFBLDZDQUFBOztNQUNFLENBQUEsR0FBSSxjQUFjLENBQUMsS0FBZixDQUFBO01BQ0osS0FBQSxHQUFRLFNBQVMsQ0FBQyxDQUFEO01BQ2pCLEVBQUEsR0FBSyxDQUFDLENBQUMsSUFBRixDQUFPLElBQUksQ0FBQyxLQUFaLEVBQW1CLElBQUksQ0FBQyxNQUF4QixDQUNDLENBQUMsSUFERixDQUNPLEtBRFA7TUFFTCxFQUFBLEdBQUssQ0FBQyxDQUFDLElBQUYsQ0FBTyxFQUFBLEdBQUssQ0FBWixDQUFjLENBQUMsTUFBZixDQUFzQixFQUFFLENBQUMsRUFBSCxDQUFBLENBQXRCLEVBQStCLEVBQUUsQ0FBQyxFQUFILENBQUEsQ0FBL0I7TUFDTCxTQUFTLENBQUMsQ0FBRCxDQUFULEdBQWU7SUFOakI7SUFPQSxVQUFBOztBQUFjO01BQUEsS0FBQSxxQ0FBQTs7cUJBQUEsZUFBZSxDQUFDLElBQWhCLENBQXFCLElBQUksQ0FBQyxLQUExQixFQUFpQyxJQUFJLENBQUMsTUFBdEM7TUFBQSxDQUFBOzs7SUFDZCxVQUFBOztBQUFjO01BQUEsS0FBQSxxQ0FBQTs7cUJBQUE7TUFBQSxDQUFBOzs7SUFDZCxLQUFBLDZDQUFBOztNQUNFLEtBQUEsR0FBUSxTQUFTLENBQUMsQ0FBRDtNQUNqQixJQUFBLEdBQU8sU0FBUyxDQUFDLENBQUQ7TUFDaEIsS0FBQSxHQUFRLFVBQVUsQ0FBQyxDQUFEO01BQ2xCLEVBQUEsR0FBSyxJQUFJLENBQUMsS0FBTCxHQUFhO01BQ2xCLEVBQUEsR0FBSyxRQUFBLEdBQVcsV0FBQSxDQUFZLENBQVosQ0FBQSxHQUFpQixJQUFqQixHQUF3QixJQUFJLENBQUM7TUFDN0MsS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFYLEVBQWMsRUFBZCxDQUFpQixDQUFDLElBQWxCLENBQXVCO1FBQUEsT0FBQSxFQUFRO01BQVIsQ0FBdkIsQ0FBaUMsQ0FBQyxNQUFsQyxDQUF5QyxNQUF6QztNQUNBLElBQUksQ0FBQyxNQUFMLENBQVksS0FBSyxDQUFDLEVBQU4sQ0FBQSxDQUFaLEVBQXdCLEtBQUssQ0FBQyxFQUFOLENBQUEsQ0FBeEI7TUFDQSxJQUFHLENBQUEsR0FBSSxDQUFQO1FBQ0UsQ0FBQSxHQUFJLFlBQUEsQ0FBYSxDQUFiO1FBQ0osS0FBQSxHQUFRLFVBQVUsQ0FBQyxDQUFEO1FBQ2xCLFVBQVUsQ0FBQyxDQUFELENBQVYsR0FBZ0IsZUFBZSxDQUFDLElBQWhCLENBQXFCLEtBQUssQ0FBQyxFQUFOLENBQUEsQ0FBckIsRUFBaUMsS0FBSyxDQUFDLEVBQU4sQ0FBQSxDQUFqQyxFQUE2QyxLQUFLLENBQUMsRUFBTixDQUFBLENBQTdDLEVBQXlELEtBQUssQ0FBQyxFQUFOLENBQUEsQ0FBekQsQ0FBb0UsQ0FBQyxNQUFyRSxDQUE0RTtVQUFBLEtBQUEsRUFBTSxNQUFOO1VBQWEsS0FBQSxFQUFNLENBQW5CO1FBQUEsQ0FBNUUsRUFIbEI7O0lBUkY7SUFZQSxXQUFBLEdBQWMsQ0FBQyxDQUFBLEdBQUksSUFBQSxHQUFPLFdBQUEsQ0FBWSxDQUFDLENBQUMsTUFBRixHQUFTLENBQXJCLENBQVosQ0FBQSxHQUF1QyxJQUFJLENBQUMsT0FuRTVEOztJQXFFRSxRQUFBLEdBQVcsUUFBQSxHQUFXLFdBQVgsR0FBeUI7SUFDcEMsVUFBQSxHQUFhLElBQUksQ0FBQyxLQUFMLENBQUE7SUFDYixlQUFBLEdBQWtCLFVBQVUsQ0FBQyxLQUFYLENBQUE7SUFDbEIsaUJBQUEsR0FBb0IsVUFBVSxDQUFDLEtBQVgsQ0FBQTtJQUNwQixjQUFBLEdBQWlCLFVBQVUsQ0FBQyxLQUFYLENBQUE7SUFDakIsSUFBQSxHQUFRO01BQUEsS0FBQSxhQUFNLENBQUMsSUFBSSxDQUFDLEtBQUwsR0FBVyxDQUFaLElBQWdCLEVBQXRCO01BQXlCLE1BQUEsYUFBTyxDQUFDLElBQUksQ0FBQyxNQUFMLEdBQVksQ0FBYixJQUFpQjtJQUFqRDtJQUNSLFNBQUE7O0FBQWE7TUFBQSxLQUFBLHFDQUFBOztxQkFBQTtNQUFBLENBQUE7OztJQUNiLEtBQUEsNkNBQUE7O01BQ0UsQ0FBQSxHQUFJLGNBQWMsQ0FBQyxLQUFmLENBQUE7TUFDSixLQUFBLEdBQVEsU0FBUyxDQUFDLENBQUQ7TUFDakIsRUFBQSxHQUFLLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBSSxDQUFDLEtBQWQsRUFBcUIsSUFBSSxDQUFDLE1BQTFCLENBQ0MsQ0FBQyxJQURGLENBQ08sS0FEUDtNQUVMLEVBQUEsR0FBSyxDQUFDLENBQUMsSUFBRixDQUFPLEVBQUEsR0FBSyxDQUFaLENBQWMsQ0FBQyxNQUFmLENBQXNCLEVBQUUsQ0FBQyxFQUFILENBQUEsQ0FBdEIsRUFBK0IsRUFBRSxDQUFDLEVBQUgsQ0FBQSxDQUEvQjtNQUNMLFNBQVMsQ0FBQyxDQUFELENBQVQsR0FBZTtJQU5qQjtJQU9BLFlBQUE7O0FBQWdCO01BQUEsS0FBQSxxQ0FBQTs7cUJBQUEsaUJBQWlCLENBQUMsTUFBbEIsQ0FBeUIsSUFBSSxDQUFDLEtBQTlCLEVBQXFDLElBQUksQ0FBQyxNQUExQztNQUFBLENBQUE7OztJQUNoQixVQUFBOztBQUFjO01BQUEsS0FBQSxxQ0FBQTs7cUJBQUE7TUFBQSxDQUFBOztTQXBGaEI7O0lBc0ZFLFdBQUE7O0FBQWU7TUFBQSxLQUFZLDZGQUFaO3FCQUFBO01BQUEsQ0FBQTs7O0lBQ2YsS0FBUyx3RkFBVDtNQUNFLFdBQVcsQ0FBQyxXQUFBLENBQVksQ0FBWixDQUFELENBQWdCLENBQUMsSUFBNUIsQ0FBaUMsQ0FBakM7SUFERjtJQUVBLEtBQUEsdURBQUE7O01BQ0UsQ0FBQSxHQUFLLFdBQUEsR0FBYyxDQUFkLEdBQWtCLEVBQTNCO01BQ0ksUUFBQSxHQUFXLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFXLENBQUEsR0FBRSxDQUFiLENBQUEsR0FBa0IsQ0FBQyxDQUFBLEdBQUksSUFBSSxDQUFDLEtBQVY7TUFDN0IsU0FBQSxHQUFZLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFXLENBQUEsR0FBRSxDQUFiLENBQUEsR0FBa0IsQ0FBQyxDQUFBLEdBQUksSUFBSSxDQUFDLEtBQVY7TUFDOUIsS0FBQSxtREFBQTs7UUFDRSxJQUFBLEdBQU8sU0FBUyxDQUFDLENBQUQ7UUFDaEIsS0FBQSxHQUFRLFlBQVksQ0FBQyxDQUFELEVBRDFCOztRQUdNLEVBQUEsR0FBSyxRQUFBLEdBQVcsRUFBQSxHQUFLO1FBQ3JCLEVBQUEsR0FBSyxRQUFBLEdBQVcsQ0FBQSxHQUFJLElBQUksQ0FBQztRQUN6QixLQUFLLENBQUMsSUFBTixDQUFXO1VBQUEsT0FBQSxFQUFRO1FBQVIsQ0FBWCxDQUNLLENBQUMsTUFETixDQUNhO1VBQUEsT0FBQSxFQUFRLENBQVI7UUFBQSxDQURiLENBRUssQ0FBQyxJQUZOLENBRVcsRUFGWCxFQUVjLEVBRmQ7UUFHQSxJQUFJLENBQUMsTUFBTCxDQUFZLEtBQUssQ0FBQyxFQUFOLENBQUEsQ0FBWixFQUF3QixLQUFLLENBQUMsRUFBTixDQUFBLENBQXhCLEVBUk47O1FBVU0sSUFBRyxDQUFBLEdBQUksQ0FBUDtVQUNFLENBQUEsR0FBSSxZQUFBLENBQWEsQ0FBYjtVQUNKLEtBQUEsR0FBUSxZQUFZLENBQUMsQ0FBRDtVQUNwQixVQUFVLENBQUMsQ0FBRCxDQUFWLEdBQWdCLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixLQUFLLENBQUMsRUFBTixDQUFBLENBQXJCLEVBQWlDLEtBQUssQ0FBQyxFQUFOLENBQUEsQ0FBakMsRUFBNkMsS0FBSyxDQUFDLEVBQU4sQ0FBQSxDQUE3QyxFQUF5RCxLQUFLLENBQUMsRUFBTixDQUFBLENBQXpELENBQW9FLENBQUMsTUFBckUsQ0FBNEUsTUFBNUUsQ0FBbUYsQ0FBQyxJQUFwRixDQUFBLEVBSGxCOztNQVhGO0lBSkY7SUFtQkEsUUFBQSxHQUFXLFFBQUEsR0FBVyxDQUFDLFdBQUEsR0FBYyxDQUFmLENBQUEsR0FBb0IsSUFBSSxDQUFDLE9BNUdqRDs7SUE4R0UsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkLEVBQW9CLElBQXBCLEVBQTBCLElBQTFCLEVBOUdUOztJQWdIRSxPQUFBLEdBQVU7SUFDVixXQUFBLEdBQWM7SUFDZCxJQUFJLENBQUMsT0FBTCxDQUFhO01BQUEsQ0FBQSxFQUFFLENBQUMsQ0FBSDtNQUFNLENBQUEsRUFBRSxDQUFDLENBQVQ7TUFBWSxLQUFBLEVBQU8sQ0FBQSxHQUFJLElBQUksQ0FBQyxLQUFMLEdBQWEsQ0FBQyxDQUFBLEdBQUksQ0FBQyxDQUFDLE1BQVAsQ0FBcEM7TUFBb0QsTUFBQSxFQUFRLENBQUEsR0FBSTtJQUFoRSxDQUFiO0lBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxFQUFBLEdBQUssSUFBSSxDQUFDLEtBQUwsR0FBYSxDQUFDLENBQUMsTUFBOUIsRUFBc0MsRUFBQSxHQUFLLFdBQTNDO0FBRUEsV0FDRSxDQUFBOztNQUFBLElBQUEsRUFBTSxJQUFOO01BQ0EsSUFBQSxFQUFNLElBRE47TUFFQSxJQUFBLEVBQU0sSUFGTjtNQUdBLFNBQUEsRUFBVyxTQUhYO01BSUEsU0FBQSxFQUFXLEVBSlg7TUFLQSxTQUFBLEVBQVcsQ0FMWDtNQU1BLElBQUE7O0FBQU87UUFBQSxLQUtJLHdGQUxKO3VCQUNMO1lBQUEsS0FBQSxFQUFPLENBQUMsQ0FBQyxDQUFELENBQVI7WUFDQSxJQUFBLEVBQU07Y0FBQSxHQUFBLEVBQUksVUFBVSxDQUFDLENBQUQsQ0FBZDtjQUFtQixJQUFBLEVBQUssV0FBVyxDQUFDLENBQUQ7WUFBbkMsQ0FETjtZQUVBLElBQUEsRUFBTTtjQUFBLEdBQUEsRUFBSSxTQUFTLENBQUMsQ0FBRCxDQUFiO2NBQWtCLElBQUEsRUFBSyxVQUFVLENBQUMsQ0FBRCxDQUFqQztjQUFzQyxXQUFBLEVBQVksVUFBVSxDQUFDLENBQUQ7WUFBNUQsQ0FGTjtZQUdBLElBQUEsRUFBTTtjQUFBLEdBQUEsRUFBSSxTQUFTLENBQUMsQ0FBRCxDQUFiO2NBQWtCLE1BQUEsRUFBTyxZQUFZLENBQUMsQ0FBRCxDQUFyQztjQUEwQyxXQUFBLEVBQVksVUFBVSxDQUFDLENBQUQ7WUFBaEU7VUFITjtRQURLLENBQUE7OztJQU5QO0VBdkhROztFQW9JWixhQUFBLEdBQWdCLFFBQUEsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsQ0FBQTtBQUNoQixRQUFBLFNBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQTs7SUFDRSxhQUFBLEdBQWdCLFFBQUEsQ0FBQyxLQUFELEVBQVEsUUFBUSxLQUFoQixDQUFBO0FBQ2xCLFVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUE7TUFBSSxDQUFBLEdBQUksSUFBSSxDQUFDLEtBQUwsQ0FBQTtNQUNKLENBQUEsR0FBSSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUksQ0FBQyxLQUFaLEVBQW1CLElBQUksQ0FBQyxNQUF4QixDQUNDLENBQUMsSUFERixDQUNPO1FBQUEsT0FBQSxFQUFRO01BQVIsQ0FEUCxDQUVDLENBQUMsTUFGRixDQUVTLE1BRlQsQ0FHQyxDQUFDLElBSEYsQ0FHTyxDQUhQLEVBR1UsSUFBSSxDQUFDLE1BSGY7TUFJSixPQUFBLEdBQVUsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUFJLEtBQUgsR0FBYyxDQUFkLEdBQXFCLENBQUMsQ0FBdkI7TUFDeEIsQ0FBQSxHQUFJLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUCxDQUFhLENBQUMsSUFBZCxDQUFtQjtRQUFBLE1BQUEsRUFBTyxXQUFQO1FBQW1CLElBQUEsRUFBSztNQUF4QixDQUFuQixDQUNDLENBQUMsTUFERixDQUNTLENBQUMsQ0FBQyxFQUFGLENBQUEsQ0FEVCxFQUNpQixDQUFDLENBQUMsRUFBRixDQUFBLENBQUEsR0FBUyxPQUQxQjtNQUVKLENBQUMsQ0FBQyxJQUFGLENBQUE7QUFDQSxhQUFPO0lBVk87SUFXaEIsU0FBQSxHQUFhO01BQUEsQ0FBQSxFQUFFLGFBQUEsQ0FBYyxHQUFkLENBQUY7TUFBc0IsQ0FBQSxFQUFFLGFBQUEsQ0FBYyxHQUFkLENBQXhCO01BQTRDLENBQUEsRUFBRSxhQUFBLENBQWMsR0FBZCxDQUE5QztNQUFrRSxDQUFBLEVBQUUsYUFBQSxDQUFjLEdBQWQsQ0FBcEU7TUFBd0YsQ0FBQSxFQUFFLGFBQUEsQ0FBYyxHQUFkLEVBQWtCLElBQWxCO0lBQTFGLEVBWmY7O0lBY0UsYUFBQSxHQUFnQixRQUFBLENBQUMsS0FBRCxDQUFBO0FBQ2xCLFVBQUE7TUFBSSxDQUFBLEdBQUksSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsS0FBZixFQUFzQixJQUFJLENBQUMsTUFBM0IsQ0FDSSxDQUFDLElBREwsQ0FDVTtRQUFBLE9BQUEsRUFBUTtNQUFSLENBRFYsQ0FFSSxDQUFDLE1BRkwsQ0FFWTtRQUFBLEtBQUEsRUFBTSxNQUFOO1FBQWEsS0FBQSxFQUFNLENBQUksS0FBQSxLQUFTLEdBQVosR0FBcUIsQ0FBckIsR0FBNEIsQ0FBN0I7TUFBbkIsQ0FGWixDQUdJLENBQUMsSUFITCxDQUdVLENBSFYsRUFHYSxJQUFJLENBQUMsTUFIbEI7TUFJSixDQUFDLENBQUMsSUFBRixDQUFBO0FBQ0EsYUFBTztJQU5PO0lBT2hCLFNBQUEsR0FBYTtNQUFBLENBQUEsRUFBRSxhQUFBLENBQWMsR0FBZCxDQUFGO01BQXNCLENBQUEsRUFBRSxhQUFBLENBQWMsR0FBZCxDQUF4QjtNQUE0QyxDQUFBLEVBQUUsYUFBQSxDQUFjLEdBQWQsQ0FBOUM7TUFBa0UsQ0FBQSxFQUFFLGFBQUEsQ0FBYyxHQUFkLENBQXBFO01BQXdGLENBQUEsRUFBRSxhQUFBLENBQWMsR0FBZDtJQUExRixFQXJCZjs7SUF1QkUsYUFBQSxHQUFnQixRQUFBLENBQUMsS0FBRCxDQUFBO0FBQ2xCLFVBQUE7TUFBSSxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsS0FBakIsRUFBd0IsSUFBSSxDQUFDLE1BQTdCLENBQ0ksQ0FBQyxJQURMLENBQ1U7UUFBQSxPQUFBLEVBQVE7TUFBUixDQURWLENBRUksQ0FBQyxNQUZMLENBRVk7UUFBQSxLQUFBLEVBQU0sTUFBTjtRQUFhLEtBQUEsRUFBTSxDQUFJLEtBQUEsS0FBUyxHQUFaLEdBQXFCLENBQXJCLEdBQTRCLENBQTdCO01BQW5CLENBRlo7TUFHSixDQUFDLENBQUMsSUFBRixDQUFBO0FBQ0EsYUFBTztJQUxPO0lBTWhCLFNBQUEsR0FBYTtNQUFBLENBQUEsRUFBRSxhQUFBLENBQWMsR0FBZCxDQUFGO01BQXNCLENBQUEsRUFBRSxhQUFBLENBQWMsR0FBZCxDQUF4QjtNQUE0QyxDQUFBLEVBQUUsYUFBQSxDQUFjLEdBQWQsQ0FBOUM7TUFBa0UsQ0FBQSxFQUFFLGFBQUEsQ0FBYyxHQUFkO0lBQXBFO0FBQ2IsV0FBUTtNQUFBLElBQUEsRUFBSyxTQUFMO01BQWdCLElBQUEsRUFBSyxTQUFyQjtNQUFnQyxJQUFBLEVBQUs7SUFBckM7RUEvQk07O0VBaUNoQixTQUFBLEdBQVk7O0VBQ1osU0FBQSxHQUFZO0lBQ1Q7TUFBQSxJQUFBLEVBQUssSUFBTDtNQUFXLEdBQUEsRUFBSSxHQUFmO01BQW9CLElBQUEsRUFBSztJQUF6QixDQURTO0lBRVQ7TUFBQSxJQUFBLEVBQUssR0FBTDtNQUFVLEdBQUEsRUFBSSxHQUFkO01BQW1CLElBQUEsRUFBSztJQUF4QixDQUZTO0lBR1Q7TUFBQSxJQUFBLEVBQUssR0FBTDtNQUFVLEdBQUEsRUFBSSxFQUFkO01BQWtCLElBQUEsRUFBSztJQUF2QixDQUhTO0lBSVQ7TUFBQSxJQUFBLEVBQUssRUFBTDtNQUFTLEdBQUEsRUFBSSxFQUFiO01BQWlCLElBQUEsRUFBSztJQUF0QixDQUpTOzs7RUFNWixNQUFNLENBQUMsWUFBUCxHQUFzQixRQUFBLENBQUEsQ0FBQTtJQUNwQixTQUFBLEdBQVksQ0FBQyxTQUFBLEdBQVksQ0FBYixDQUFBLEdBQWtCLFNBQVMsQ0FBQztXQUN4QyxRQUFRLENBQUMsY0FBVCxDQUF3QixjQUF4QixDQUF1QyxDQUFDLFNBQXhDLEdBQW9ELFNBQVMsQ0FBQyxTQUFELENBQVcsQ0FBQztFQUZyRDs7RUFJdEIsZ0JBQUEsR0FBbUIsUUFBQSxDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsQ0FBYixDQUFBO0lBQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixDQUFwQjtXQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBRCxDQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUF6QixDQUFnQztNQUFBLEtBQUEsRUFBTSxNQUFOO01BQWMsT0FBQSxFQUFRLENBQXRCO01BQXlCLEtBQUEsRUFBTTtJQUEvQixDQUFoQztFQUZpQjs7RUFHbkIsZUFBQSxHQUFrQixRQUFBLENBQUMsSUFBRCxDQUFBO0FBQ2xCLFFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUE7QUFBRTtJQUFBLEtBQUEscUNBQUE7O01BQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFELENBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQXpCLENBQWdDO1FBQUEsT0FBQSxFQUFRO01BQVIsQ0FBaEM7SUFERjtXQUVBLElBQUksQ0FBQyxTQUFMLEdBQWlCO0VBSEQ7O0VBS2xCLGNBQUEsR0FBaUIsUUFBQSxDQUFDLEdBQUQsRUFBTSxHQUFOLENBQUE7SUFDZixJQUFHLEdBQUcsQ0FBQyxPQUFKLENBQUEsQ0FBSDtBQUNFLGFBQU8sR0FBRyxDQUFDLE9BQUosQ0FBWSxHQUFaLEVBRFQ7S0FBQSxNQUFBO0FBR0UsYUFBTyxHQUFHLENBQUMsSUFBSixDQUFBLEVBSFQ7O0VBRGU7O0VBTWpCLE9BQUEsR0FBVSxRQUFBLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLENBQUE7QUFDVixRQUFBLFdBQUEsRUFBQSxpQkFBQSxFQUFBLEdBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQTs7SUFDRSxPQUFBLEdBQVUsUUFBQSxDQUFDLElBQUQsQ0FBQTtBQUNaLFVBQUEsR0FBQSxFQUFBO01BQUksR0FBQSxHQUFNLFNBQVMsQ0FBQyxTQUFELENBQVcsQ0FBQyxJQUEvQjs7TUFFSSxjQUFBLENBQWUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBRCxDQUE3QixFQUFxQyxHQUFyQyxDQUF5QyxDQUFDLENBQTFDLENBQTRDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBRCxDQUFQLEdBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBdEUsRUFGSjs7TUFJSSxJQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBRCxDQUFQLEdBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBN0I7UUFDRSxJQUFBLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUQsQ0FBUixDQUFlLENBQUMsSUFBSSxDQUFDO1FBQ3JDLGNBQUEsQ0FBZSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFELENBQTdCLEVBQXFDLEdBQXJDLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsSUFBSSxDQUFDLENBQUwsQ0FBQSxDQUEvQyxFQUF5RCxJQUFJLENBQUMsQ0FBTCxDQUFBLENBQXpELEVBRkY7T0FKSjs7TUFRSSxJQUFBLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUQsQ0FBUixDQUFlLENBQUMsSUFBSSxDQUFDO2FBQ3JDLGNBQUEsQ0FBZSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFELENBQTdCLEVBQXFDLEdBQXJDLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsSUFBSSxDQUFDLENBQUwsQ0FBQSxDQUEvQyxFQUF5RCxJQUFJLENBQUMsQ0FBTCxDQUFBLENBQXpEO0lBVlE7SUFXVixRQUFBLEdBQVcsUUFBQSxDQUFDLElBQUQsQ0FBQTtNQUNULElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUQsQ0FBTSxDQUFDLElBQXJCLENBQUE7TUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFELENBQU0sQ0FBQyxJQUFyQixDQUFBO2FBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBRCxDQUFNLENBQUMsSUFBckIsQ0FBQTtJQUhTO0lBSVgsaUJBQUEsR0FBb0IsUUFBQSxDQUFDLENBQUQsRUFBRyxDQUFILENBQUE7QUFDdEIsVUFBQSxFQUFBLEVBQUE7TUFBSSxJQUFHLENBQUEsS0FBSyxDQUFSO1FBQ0UsRUFBQSxHQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBRDtRQUNkLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQXBCLENBQTJCO1VBQUEsS0FBQSxFQUFPLE1BQVA7VUFBZSxLQUFBLEVBQU07UUFBckIsQ0FBM0I7UUFDQSxJQUFHLENBQUEsR0FBSSxJQUFJLENBQUMsU0FBWjtVQUNFLEVBQUEsR0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUQ7VUFDZCxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFwQixDQUFBO1VBQ0EsSUFBRyxFQUFFLENBQUMsS0FBSCxHQUFXLEVBQUUsQ0FBQyxLQUFqQjtZQUNFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQXBCLENBQTJCO2NBQUEsS0FBQSxFQUFPLE1BQVA7Y0FBZSxLQUFBLEVBQU07WUFBckIsQ0FBM0I7bUJBQ0EsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBcEIsQ0FBMkI7Y0FBQSxLQUFBLEVBQU8sTUFBUDtjQUFlLEtBQUEsRUFBTSxDQUFyQjtZQUFBLENBQTNCLEVBRkY7V0FBQSxNQUFBO21CQUlFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQXBCLENBQTJCO2NBQUEsS0FBQSxFQUFPLE1BQVA7Y0FBZSxLQUFBLEVBQU07WUFBckIsQ0FBM0IsRUFKRjtXQUhGO1NBQUEsTUFBQTtpQkFTRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFwQixDQUFBLEVBVEY7U0FIRjs7SUFEa0I7SUFjcEIsV0FBQSxHQUFjLFFBQUEsQ0FBQyxDQUFELENBQUE7QUFDaEIsVUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBO01BQUksQ0FBQyxDQUFELEVBQUcsQ0FBSCxFQUFLLENBQUwsQ0FBQSxHQUFVLENBQUMsWUFBQSxDQUFhLENBQWIsQ0FBRCxFQUFrQixVQUFBLENBQVcsQ0FBWCxFQUFhLElBQUksQ0FBQyxTQUFsQixDQUFsQixFQUFnRCxXQUFBLENBQVksQ0FBWixFQUFjLElBQUksQ0FBQyxTQUFuQixDQUFoRDtNQUNWLGlCQUFBLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO01BQ0EsaUJBQUEsQ0FBa0IsQ0FBbEIsRUFBb0IsQ0FBcEI7YUFDQSxpQkFBQSxDQUFrQixDQUFsQixFQUFvQixDQUFwQjtJQUpZO0FBTWQsWUFBTyxJQUFJLENBQUMsR0FBWjtBQUFBLFdBQ08sR0FBRyxDQUFDLElBRFg7UUFDcUI7QUFBZDtBQURQLFdBRU8sR0FBRyxDQUFDLEtBRlg7UUFHSSxJQUFJLENBQUMsU0FBTCxHQUFpQixJQUFJLENBQUM7UUFDdEIsY0FBQSxDQUFlLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQTlCLEVBQWlDLFNBQVMsQ0FBQyxTQUFELENBQVcsQ0FBQyxHQUF0RCxDQUEwRCxDQUFDLENBQTNELENBQTZELElBQUksQ0FBQyxFQUFMLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFqRjtRQUNBLElBQUcsSUFBSSxDQUFDLEVBQUwsR0FBVSxJQUFJLENBQUMsSUFBbEI7VUFDRSxLQUFTLHlHQUFUO1lBQ0UsV0FBQSxDQUFZLENBQVosRUFERjtVQUFBLENBREY7U0FBQSxNQUFBO1VBSUUsS0FBUyw0R0FBVDtZQUNFLFdBQUEsQ0FBWSxDQUFaO1VBREYsQ0FKRjs7QUFIRztBQUZQLFdBV08sR0FBRyxDQUFDLE9BWFg7UUFZSSxJQUFHLGVBQUg7VUFDRSxPQUFBLENBQVEsR0FBUjtVQUNBLGdCQUFBLENBQWlCLElBQWpCLEVBQXVCLElBQXZCLEVBQTZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBckM7VUFDQSxJQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBUixLQUFhLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBeEI7WUFDRSxRQUFBLENBQVMsR0FBVDtZQUNBLFFBQUEsQ0FBUyxHQUFULEVBRkY7V0FBQSxNQUFBO1lBSUUsT0FBQSxDQUFRLEdBQVI7WUFDQSxJQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBUixLQUFhLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBeEI7Y0FDRSxRQUFBLENBQVMsR0FBVCxFQURGO2FBQUEsTUFBQTtjQUdFLE9BQUEsQ0FBUSxHQUFSLEVBSEY7YUFMRjtXQUhGO1NBQUEsTUFBQTtVQWFJLFFBQUEsQ0FBUyxHQUFUO1VBQ0EsUUFBQSxDQUFTLEdBQVQ7VUFDQSxRQUFBLENBQVMsR0FBVCxFQWZKOztBQURHO0FBWFAsV0E0Qk8sR0FBRyxDQUFDLE9BNUJYO1FBNkJJLElBQUcsZUFBSDtVQUNFLE9BQUEsQ0FBUSxHQUFSO1VBQ0EsZ0JBQUEsQ0FBaUIsSUFBakIsRUFBdUIsSUFBdkIsRUFBNkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFyQztVQUNBLElBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFSLEtBQWEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUF4QjtZQUNFLFFBQUEsQ0FBUyxHQUFULEVBREY7V0FBQSxNQUFBO1lBR0UsT0FBQSxDQUFRLEdBQVIsRUFIRjtXQUhGO1NBQUEsTUFBQTtVQVFFLFFBQUEsQ0FBUyxHQUFUO1VBQ0EsUUFBQSxDQUFTLEdBQVQsRUFURjs7QUFERztBQTVCUCxXQXVDTyxHQUFHLENBQUMsSUF2Q1g7UUF3Q0ksRUFBQSxHQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQU47UUFDZCxFQUFBLEdBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBTjtRQUNkLEdBQUEsR0FBTSxTQUFTLENBQUMsU0FBRCxDQUFXLENBQUMsS0FGakM7O1FBSU0sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBWixDQUFvQixHQUFwQixDQUF3QixDQUFDLE1BQXpCLENBQWdDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQWIsQ0FBQSxDQUFoQyxFQUFtRCxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFiLENBQUEsQ0FBbkQ7UUFDQSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFaLENBQW9CLEdBQXBCLENBQXdCLENBQUMsTUFBekIsQ0FBZ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBYixDQUFBLENBQWhDLEVBQW1ELEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQWIsQ0FBQSxDQUFuRDtRQUNBLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQWIsQ0FBcUIsR0FBckIsQ0FBeUIsQ0FBQyxJQUExQixDQUErQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFOLENBQTdDO1FBQ0EsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBYixDQUFxQixHQUFyQixDQUF5QixDQUFDLElBQTFCLENBQStCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQU4sQ0FBN0MsRUFQTjs7UUFTTSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFaLENBQW9CLEdBQXBCLENBQXdCLENBQUMsTUFBekIsQ0FBZ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBYixDQUFBLENBQWhDLEVBQW1ELEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQWIsQ0FBQSxDQUFuRDtRQUNBLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQVosQ0FBb0IsR0FBcEIsQ0FBd0IsQ0FBQyxNQUF6QixDQUFnQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFiLENBQUEsQ0FBaEMsRUFBbUQsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBYixDQUFBLENBQW5ELEVBVk47O1FBWU0sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBWixDQUFvQixHQUFwQixDQUF3QixDQUFDLE1BQXpCLENBQWdDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQWYsQ0FBQSxDQUFoQyxFQUFxRCxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFmLENBQUEsQ0FBckQ7UUFDQSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFaLENBQW9CLEdBQXBCLENBQXdCLENBQUMsTUFBekIsQ0FBZ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBZixDQUFBLENBQWhDLEVBQXFELEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQWYsQ0FBQSxDQUFyRDtRQUNBLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBdUIsR0FBdkIsQ0FBMkIsQ0FBQyxJQUE1QixDQUFpQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFOLENBQS9DO1FBQ0EsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBZixDQUF1QixHQUF2QixDQUEyQixDQUFDLElBQTVCLENBQWlDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQU4sQ0FBL0MsRUFmTjs7UUFpQk0sQ0FBQyxFQUFFLENBQUMsS0FBSixFQUFXLEVBQUUsQ0FBQyxLQUFkLENBQUEsR0FBdUIsQ0FBQyxFQUFFLENBQUMsS0FBSixFQUFXLEVBQUUsQ0FBQyxLQUFkO1FBQ3ZCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFULEVBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUF0QixDQUFBLEdBQTZCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFULEVBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUF0QjtRQUM3QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBVCxFQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBdEIsQ0FBQSxHQUE2QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBVCxFQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBdEI7UUFDN0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQVQsRUFBYyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQXRCLENBQUEsR0FBNkIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQVQsRUFBYyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQXRCO1FBQzdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBTixDQUFmLEVBQXlCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQU4sQ0FBdkMsQ0FBQSxHQUFtRCxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQU4sQ0FBZixFQUF5QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFOLENBQXZDO1FBQ25ELFdBQUEsQ0FBWSxJQUFJLENBQUMsQ0FBakI7UUFDQSxXQUFBLENBQVksSUFBSSxDQUFDLENBQWpCO0FBeEJHO0FBdkNQLFdBZ0VPLEdBQUcsQ0FBQyxVQWhFWDtRQWlFSSxlQUFBLENBQWdCLElBQWhCO0FBakVKO1dBa0VBO0VBdkdRLEVBcFJWOzs7RUE4WEEsT0FBQSxHQUFVOztFQUNWLFdBQUEsR0FBYyxRQUFBLENBQUEsQ0FBQTtXQUFNLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBUyxDQUFDLFNBQUQsQ0FBVyxDQUFDLElBQTlCLEVBQW9DLFNBQVMsQ0FBQyxTQUFELENBQVcsQ0FBQyxHQUF6RDtFQUFOOztFQUNkLG9CQUFBLEdBQXVCLFFBQUEsQ0FBQSxDQUFBO0lBQ3JCLFFBQVEsQ0FBQyxjQUFULENBQXdCLGFBQXhCLENBQXNDLENBQUMsU0FBdkMsR0FBbUQ7V0FDbkQsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBc0MsQ0FBQyxRQUF2QyxHQUFrRDtFQUY3Qjs7RUFHdkIsb0JBQUEsR0FBdUIsUUFBQSxDQUFBLENBQUE7SUFDckIsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBc0MsQ0FBQyxTQUF2QyxHQUFtRDtXQUNuRCxRQUFRLENBQUMsY0FBVCxDQUF3QixhQUF4QixDQUFzQyxDQUFDLFFBQXZDLEdBQWtEO0VBRjdCLEVBbll2Qjs7O0VBdVlBLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ2xCLFlBQU8sT0FBUDtBQUFBLFdBQ08sQ0FEUDtRQUVJLE9BQUEsR0FBVTtRQUNWLG9CQUFBLENBQUE7ZUFDQSxZQUFBLENBQUE7QUFKSixXQUtPLENBTFA7ZUFNSSxPQUFBLEdBQVU7QUFOZDtFQURrQixFQXZZcEI7OztFQWdaQSxZQUFBLEdBQWUsUUFBQSxDQUFBLENBQUE7QUFDZixRQUFBO0lBQUUsR0FBQSxHQUFNLFdBQUEsQ0FBQTtJQUNOLElBQUcsT0FBQSxLQUFXLENBQVgsSUFBaUIsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFwQjtNQUNFLG9CQUFBLENBQUE7TUFDQSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQVgsQ0FBbUI7UUFBQSxRQUFBLEVBQVM7TUFBVCxDQUFuQixDQUFnQyxDQUFDLEtBQWpDLENBQXVDLFFBQUEsQ0FBQSxDQUFBO2VBQU0sWUFBQSxDQUFBO01BQU4sQ0FBdkMsRUFGRjtLQUFBLE1BR0ssSUFBRyxPQUFBLEtBQVcsQ0FBZDtNQUNILG9CQUFBLENBQUEsRUFERzs7V0FFTDtFQVBhOztFQVNmLHNCQUFBLEdBQXlCLFFBQUEsQ0FBQyxTQUFELENBQUE7QUFDekIsUUFBQTtJQUFFLEtBQUEsR0FBUSxDQUFJLFNBQUgsR0FBa0IsSUFBbEIsR0FBNEIsTUFBN0I7SUFDUixRQUFRLENBQUMsY0FBVCxDQUF3QixlQUF4QixDQUF3QyxDQUFDLFFBQXpDLEdBQW9EO0lBQ3BELFFBQVEsQ0FBQyxjQUFULENBQXdCLFNBQXhCLENBQWtDLENBQUMsUUFBbkMsR0FBOEM7SUFDOUMsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsVUFBeEIsQ0FBbUMsQ0FBQyxRQUFwQyxHQUErQztJQUMvQyxRQUFRLENBQUMsY0FBVCxDQUF3QixXQUF4QixDQUFvQyxDQUFDLFFBQXJDLEdBQWdEO0lBQ2hELFFBQVEsQ0FBQyxjQUFULENBQXdCLFNBQXhCLENBQWtDLENBQUMsUUFBbkMsR0FBOEM7V0FDOUMsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsU0FBeEIsQ0FBa0MsQ0FBQyxRQUFuQyxHQUE4QztFQVB2Qjs7RUFTekIsTUFBTSxDQUFDLFVBQVAsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQTtJQUFFLElBQUcsaUJBQUg7TUFDRSxJQUFBLEdBQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFWLENBQUE7TUFDUCxJQUFHLElBQUksQ0FBQyxJQUFSO1FBQ0UsS0FBSyxDQUFDLEdBQU4sR0FBWTtRQUNaLHNCQUFBLENBQXVCLElBQXZCLEVBRkY7T0FBQSxNQUFBO1FBSUUsT0FBQSxDQUFRLEtBQUssQ0FBQyxJQUFkLEVBQW9CLEtBQUssQ0FBQyxJQUExQixFQUFnQyxJQUFJLENBQUMsS0FBckM7UUFDQSxRQUFRLENBQUMsY0FBVCxDQUF3QixLQUF4QixDQUE4QixDQUFDLFNBQS9CLEdBQTJDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDdEQsc0JBQUEsQ0FBdUIsS0FBdkIsRUFORjs7YUFPQSxLQVRGO0tBQUEsTUFBQTthQVdFLE1BWEY7O0VBRGtCOztFQWNwQixNQUFNLENBQUMsaUJBQVAsR0FBMkIsUUFBQSxDQUFBLENBQUE7SUFDekIsSUFBRyxpQkFBSDthQUNFLEtBREY7S0FBQSxNQUFBO01BR0UsZUFBQSxDQUFnQixLQUFLLENBQUMsSUFBdEI7TUFDQSxLQUFLLENBQUMsR0FBTixHQUFZLGdCQUFBLENBQWlCLEtBQUssQ0FBQyxDQUF2QixFQUEwQixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQXJDO01BQ1osT0FBQSxHQUFVO2FBQ1YsWUFBQSxDQUFBLEVBTkY7O0VBRHlCOztFQVMzQixNQUFNLENBQUMsWUFBUCxHQUFzQixRQUFBLENBQUEsQ0FBQTtJQUNwQixJQUFHLGlCQUFIO2FBQ0UsS0FERjtLQUFBLE1BQUE7TUFHRSxlQUFBLENBQWdCLEtBQUssQ0FBQyxJQUF0QjtNQUNBLEtBQUssQ0FBQyxHQUFOLEdBQVksV0FBQSxDQUFZLEtBQUssQ0FBQyxDQUFsQixFQUFxQixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQWhDO01BQ1osT0FBQSxHQUFVO2FBQ1YsWUFBQSxDQUFBLEVBTkY7O0VBRG9COztFQVN0QixNQUFNLENBQUMsZUFBUCxHQUF5QixRQUFBLENBQUEsQ0FBQTtBQUN6QixRQUFBO0lBQUUsSUFBRyxpQkFBSDthQUNFLEtBREY7S0FBQSxNQUFBO01BR0UsU0FBQSxHQUFZLFNBQUEsQ0FBQSxDQUFBO2VBQU0sQ0FBQSxNQUFPO1VBQUEsR0FBQSxFQUFJLEdBQUcsQ0FBQyxLQUFSO1VBQWUsSUFBQSxFQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBL0I7VUFBMEMsRUFBQSxFQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBckQ7VUFBNkQsR0FBQSxFQUFJO1FBQWpFLENBQVA7TUFBTjtNQUNaLGVBQUEsQ0FBZ0IsS0FBSyxDQUFDLElBQXRCO01BQ0EsS0FBSyxDQUFDLEdBQU4sR0FBWSxTQUFBLENBQUE7TUFDWixPQUFBLEdBQVU7YUFDVixZQUFBLENBQUEsRUFQRjs7RUFEdUI7O0VBVXpCLE1BQU0sQ0FBQyxzQkFBUCxHQUFnQyxRQUFBLENBQUEsQ0FBQTtBQUNoQyxRQUFBLENBQUEsRUFBQTtJQUFFLEtBQUEsR0FBUSxRQUFRLENBQUMsY0FBVCxDQUF3QixlQUF4QixDQUF3QyxDQUFDO0lBQ2pELENBQUEsR0FBSSxJQUFJLENBQUMsR0FBTCxDQUFTLEtBQVQ7SUFDSixJQUFHLFFBQUEsS0FBWSxPQUFPLENBQW5CLElBQXlCLENBQUEsSUFBSyxDQUE5QixJQUFvQyxDQUFBLEdBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxTQUF0RDtNQUNFLElBQUcsaUJBQUg7ZUFDRSxLQURGO09BQUEsTUFBQTtRQUdFLGVBQUEsQ0FBZ0IsS0FBSyxDQUFDLElBQXRCO1FBQ0EsS0FBSyxDQUFDLEdBQU4sR0FBWSxnQkFBQSxDQUFpQixLQUFLLENBQUMsQ0FBdkIsRUFBMEIsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFyQyxFQUFnRCxDQUFoRCxFQUFtRCxJQUFuRDtRQUNaLE9BQUEsR0FBVTtlQUNWLFlBQUEsQ0FBQSxFQU5GO09BREY7O0VBSDhCOztFQVloQyxNQUFNLENBQUMsZUFBUCxHQUF5QixRQUFBLENBQUEsQ0FBQTtJQUN2QixJQUFHLGlCQUFIO2FBQ0UsS0FERjtLQUFBLE1BQUE7TUFHRSxlQUFBLENBQWdCLEtBQUssQ0FBQyxJQUF0QjtNQUNBLEtBQUssQ0FBQyxHQUFOLEdBQVksU0FBQSxDQUFVLEtBQUssQ0FBQyxDQUFoQjtNQUNaLE9BQUEsR0FBVTthQUNWLFlBQUEsQ0FBQSxFQU5GOztFQUR1Qjs7RUFTekIsTUFBTSxDQUFDLGdCQUFQLEdBQTBCLFFBQUEsQ0FBQSxDQUFBO0lBQ3hCLElBQUcsaUJBQUg7YUFDRSxLQURGO0tBQUEsTUFBQTtNQUdFLGVBQUEsQ0FBZ0IsS0FBSyxDQUFDLElBQXRCO01BQ0EsS0FBSyxDQUFDLEdBQU4sR0FBWSxVQUFBLENBQVcsS0FBSyxDQUFDLENBQWpCO01BQ1osT0FBQSxHQUFVO2FBQ1YsWUFBQSxDQUFBLEVBTkY7O0VBRHdCOztFQVMxQixJQUFBLEdBQU8sUUFBQSxDQUFBLENBQUE7SUFDTCxLQUFLLENBQUMsSUFBTixHQUFhLEdBQUEsQ0FBSSxTQUFKO0lBQ2IsS0FBSyxDQUFDLElBQU4sR0FBYSxTQUFBLENBQVUsS0FBSyxDQUFDLElBQWhCLEVBQXNCLEtBQUssQ0FBQyxDQUE1QjtXQUNiLEtBQUssQ0FBQyxHQUFOLEdBQVk7RUFIUDs7RUFLUCxHQUFHLENBQUMsRUFBSixDQUFPLFFBQVAsRUFBaUIsa0JBQWpCLEVBQXFDLElBQXJDO0FBL2VBIiwic291cmNlc0NvbnRlbnQiOlsic3RhdGUgPVxuICBBOiBbNCwgOCwgMTAsIDIwLCA1LCA2LCAxMywgMTIsIDI1LCAxNSwgMTQsIDAsIDI2LCA5LCAzLCAxLCAxOSwgMiwgMjQsIDI4LCAxNywgMjMsIDI3LCA3LCAxMSwgMjksIDIxLCAzMCwgMjIsIDE4LCAxNl1cblxucGFyZW50X2luZGV4ID0gKGkpIC0+XG4gIHAgPSAoaSAtIDEpIC8vIDJcbiAgcmV0dXJuIChpZiAwIDwgaSB0aGVuIHAgZWxzZSBpKVxubGVmdF9pbmRleCA9IChpLCBuKSAtPlxuICBsID0gMiAqIGkgKyAxXG4gIHJldHVybiAoaWYgbCA8IG4gdGhlbiBsIGVsc2UgaSlcbnJpZ2h0X2luZGV4ID0gKGksIG4pIC0+XG4gIHIgPSAyICogaSArIDJcbiAgcmV0dXJuIChpZiByIDwgbiB0aGVuIHIgZWxzZSBpKVxuaW5kZXhfZGVwdGggPSAoaSkgLT5cbiAgaWYgaSA9PSAwIHRoZW4gMCBlbHNlIDEgKyBpbmRleF9kZXB0aChwYXJlbnRfaW5kZXgoaSkpXG5pbmRleF9oZWlnaHQgPSAoaSwgbikgLT5cbiAgbCA9IGxlZnRfaW5kZXgoaSxuKVxuICByZXR1cm4gKGlmIGwgPT0gaSB0aGVuIDAgZWxzZSAxICsgaW5kZXhfaGVpZ2h0KGwsbikpXG5cbkFjdCA9IChub25lOjAsc3dhcDoxLHNldF9uOjIsc2V0X21oZDozLHNldF9taHU6NCxjbGVhcl9wYXRoOjUpXG5cbnN3YXBfaW5kaWNlcyA9IChBLCBpLCBqKSAtPlxuICB5aWVsZCAoYWN0OkFjdC5zd2FwLCBpOmksIGo6aiwgbXNnOlwiU3dhcCBBWyN7aX1dLCBBWyN7an1dXCIpXG4gIFtBW2ldLEFbal1dID0gW0Fbal0sQVtpXV1cblxubWF4X2hlYXBpZnlfZG93biA9IChBLCBuLCBpLCBmcm9tKSAtPiAjIE8obG9nIGkpXG4gIFtsLCByXSA9IFtsZWZ0X2luZGV4KGksIG4pLCByaWdodF9pbmRleChpLCBuKV0gIyBPKDEpIGluZGljZXNcbiAgYyA9IChpZiBBW3JdIDwgQVtsXSB0aGVuIGwgZWxzZSByKSAjIE8oMSkgaW5kZXggb2YgbGFyZ2VzdCBjaGlsZFxuICB0byA9IChpOmksbDpsLHI6cixjOmMpXG4gIHlpZWxkIChhY3Q6QWN0LnNldF9taGQsIGZyb206ZnJvbSwgdG86dG8sIG1zZzpcIk1heCBIZWFwaWZ5aW5nIERvd24gZnJvbSBBWyN7aX1dID0gI3tBW2ldfVwiKVxuICBpZiBBW2ldIDwgQVtjXSAgICAgICAgICAgICAgICAgICAgICMgTygxKSBjb21wYXJlXG4gICAgeWllbGQgZnJvbSBzd2FwX2luZGljZXMoQSxpLGMpICAgIyBPKDEpIHN3YXAgY2hpbGRcbiAgICB5aWVsZCBmcm9tIG1heF9oZWFwaWZ5X2Rvd24oQSwgbiwgYywgdG8pICMgTyhsb2cgYykgcmVjdXJzaXZlIGNhbGxcbiAgZWxzZVxuICAgIHlpZWxkIChhY3Q6QWN0LnNldF9taGQsIGZyb206dG8sIHRvOm51bGwsIG1zZzpcIlwiKVxuXG5tYXhfaGVhcGlmeV91cCA9IChBLCBuLCBpLCBmcm9tKSAtPiAgICAgICAjIE8obG9nIG4gLSBsb2cgaSlcbiAgcCA9IHBhcmVudF9pbmRleChpKSAgICAgICAgICAgICAgICMgTygxKSBpbmRleCBvZiBwYXJlbnQgKG9yIGkpXG4gIHRvID0gKGk6aSxwOnApXG4gIHlpZWxkIChhY3Q6QWN0LnNldF9taHUsIGZyb206ZnJvbSwgdG86dG8sIG1zZzpcIk1heCBIZWFwaWZ5aW5nIFVwIGZyb20gQVsje2l9XSA9ICN7QVtpXX1cIilcbiAgaWYgQVtwXSA8IEFbaV0gICAgICAgICAgICAgICAgICAgICMgTygxKSBjb21wYXJlXG4gICAgeWllbGQgZnJvbSBzd2FwX2luZGljZXMoQSxpLHApICAjIE8oMSkgc3dhcCBwYXJlbnRcbiAgICB5aWVsZCBmcm9tIG1heF9oZWFwaWZ5X3VwKEEsIG4sIHAsIG51bGwpICMgTyhsb2cgbiAtIGxvZyBwKSByZWN1cnNpdmUgY2FsbCBvbiBwYXJlbnRcbiAgZWxzZVxuICAgIHlpZWxkIChhY3Q6QWN0LnNldF9taHUsIGZyb206dG8sIHRvOm51bGwsIG1zZzpcIlwiKVxuXG5oZWFwX2luc2VydCA9IChBLCBuKSAtPiAjIEFbbl0gaXMgbmV3IHZhbHVlXG4gIGlmIG4gPCBBLmxlbmd0aFxuICAgIG5ld19uID0gbiArIDFcbiAgICB5aWVsZCAoYWN0OkFjdC5zZXRfbiwgZnJvbTpuLCB0bzpuZXdfbiwgbXNnOlwiSW5jcmVhc2UgbjogI3tufSAtPiAje25ld19ufVwiKVxuICAgIHlpZWxkIGZyb20gbWF4X2hlYXBpZnlfdXAoQSwgbmV3X24sIG4sIG51bGwpXG5cbmhlYXBfZXh0cmFjdF9tYXggPSAoQSwgbikgLT4gIyBtYXggdmFsdWUgdG8gYmUgcHV0IGF0IEFbbi0xXVxuICBpZiBuID4gMFxuICAgIG5ld19uID0gbiAtIDFcbiAgICB5aWVsZCAoYWN0OkFjdC5zZXRfbiwgZnJvbTpuLCB0bzpuZXdfbiwgbXNnOlwiRGVjcmVhc2UgbjogI3tufSAtPiAje25ld19ufVwiKVxuICAgIHlpZWxkIGZyb20gc3dhcF9pbmRpY2VzKEEsMCxuZXdfbilcbiAgICB5aWVsZCBmcm9tIG1heF9oZWFwaWZ5X2Rvd24oQSwgbmV3X24sIDAsIG51bGwpXG5cbmJ1aWxkX2hlYXAgPSAoQSkgLT5cbiAgbiA9IEEubGVuZ3RoXG4gIGlmIG4gPiAxXG4gICAgeWllbGQgKGFjdDpBY3Quc2V0X24sIGZyb206MCwgdG86biwgbXNnOlwiSW5zZXJ0IGFsbCAje259IGVsZW1lbnRzXCIpXG4gICAgZm9yIGkgaW4gWyhuLy8yKS0xIC4uIDBdICMgTyhuKSBsb29wIGZvcndhcmQgb3ZlciBhcnJheVxuICAgICAgeWllbGQgZnJvbSBtYXhfaGVhcGlmeV9kb3duKEEsIG4sIGkpICMgTyhsb2cgbiAtIGxvZyBpKSkgZml4IG1heCBoZWFwXG4gICAgICB5aWVsZCAoYWN0OkFjdC5jbGVhcl9wYXRoLCBtc2c6XCJcIilcblxuaGVhcF9zb3J0ID0gKEEpIC0+XG4gIG1heF9uID0gQS5sZW5ndGhcbiAgaWYgbWF4X24gPiAxXG4gICAgeWllbGQgZnJvbSBidWlsZF9oZWFwKEEpICMgTyhuKSBidWlsZFxuICAgIGZvciBuIGluIFttYXhfbiAuLi4gMF0gIyBPKG4pIGxvb3AgYmFja3dhcmQgb3ZlciBhcnJheVxuICAgICAgeWllbGQgZnJvbSBoZWFwX2V4dHJhY3RfbWF4KEEsbikgIyBPKGxvZyBuKSBleHRyYWN0IGFuZCBmaXhcbiAgICAgIHlpZWxkIChhY3Q6QWN0LmNsZWFyX3BhdGgsIG1zZzpcIlwiKVxuXG4jIGZpbmQgbWF4aW11bSB3aWR0aCBhbmQgaGVpZ2h0IG9mIGFsbCBjZWxsc1xuYmlnZ2VzdF9iYm94ID0gKEEpIC0+XG4gIGJib3ggPSAod2lkdGg6MCwgaGVpZ2h0OjApXG4gIGZvciB2IGluIEFcbiAgICB2Ym94ID0gdi5iYm94KClcbiAgICBiYm94LndpZHRoID0gTWF0aC5tYXgoYmJveC53aWR0aCwgdmJveC53aWR0aClcbiAgICBiYm94LmhlaWdodCA9IE1hdGgubWF4KGJib3guaGVpZ2h0LCB2Ym94LmhlaWdodClcbiAgcmV0dXJuIGJib3hcblxubWF4ID0gKEEpIC0+IHJldHVybiBBLnJlZHVjZSgoYSxiKSAtPiBNYXRoLm1heChhLGIpKVxuQ29sb3IgPSBuZXQuYnJlaGF1dC5Db2xvclxuXG5pbml0X2RyYXcgPSAoZHJhdywgQSkgLT5cbiAgdHJlZV9oZWlnaHQgPSBpbmRleF9kZXB0aChBLmxlbmd0aC0xKVxuICAjIyMjIyMjIyBmbGF0IGFycmF5IGdyYXBoaWNzICMjIyMjIyMjXG4gIGFycmF5X2dyb3VwID0gZHJhdy5ncm91cCgpXG4gIHJlY3RfZ3JvdXAgPSBhcnJheV9ncm91cC5ncm91cCgpXG4gIG51bV9ncm91cCA9IGFycmF5X2dyb3VwLmdyb3VwKClcbiAgbGV2ZWxfZ3JvdXAgPSBhcnJheV9ncm91cC5ncm91cCgpXG4gICMgY3JlYXRlIHRleHQgZWxlbWVudHMgZm9yIG51bWJlcnNcbiAgYXJyYXlfbnVtcyA9IChudW1fZ3JvdXAudGV4dChcIlwiICsgdikgZm9yIHYgaW4gQSlcbiAgIyBkZXRlcm1pbmUgaG93IGJpZyBlYWNoIGNlbGwgb2YgQSBzaG91bGQgYmVcbiAgYmJveCA9IGJpZ2dlc3RfYmJveChhcnJheV9udW1zKVxuICBtYXJnaW4gPSA2XG4gIGJib3gud2lkdGggKz0gbWFyZ2luXG4gIGJib3guaGVpZ2h0ICs9IG1hcmdpblxuICAjIGNyZWF0ZSByZWN0YW5nbGVzIGZvciBlYWNoIGNlbGxcbiAgYXJyYXlfcmVjdHMgPSAocmVjdF9ncm91cC5yZWN0KGJib3gud2lkdGgsIGJib3guaGVpZ2h0KSBmb3IgdiBpbiBBKVxuICAjIGNvbXB1dGUgY29sb3JzXG4gIHJlZCA9IENvbG9yKGh1ZTogMCwgc2F0dXJhdGlvbjogMSwgdmFsdWU6IDEpXG4gIGluX2NvbG9ycyA9IChyZWQuc2hpZnRIdWUodioxMCkubGlnaHRlbkJ5UmF0aW8oMC41NSkudG9DU1MoKSBmb3IgdiBpbiBBKVxuICAjIHBvc2l0aW9uIGFycmF5IGVsZW1lbnRzXG4gIGZvciB2LGkgaW4gQVxuICAgIGNvbG9yID0gaW5fY29sb3JzW2ldICMgb3V0X2NvbG9yXG4gICAgYW51bSA9IGFycmF5X251bXNbaV1cbiAgICBhcmVjdCA9IGFycmF5X3JlY3RzW2ldXG4gICAgIyBwbGFjZSBhcnJheSBjZWxsXG4gICAgYXggPSBiYm94LndpZHRoICogaVxuICAgIGF5ID0gYmJveC5oZWlnaHRcbiAgICBhcmVjdC5maWxsKGNvbG9yKVxuICAgICAgICAgLnN0cm9rZSgnI2ZmZicpXG4gICAgICAgICAubW92ZShheCwgYXkpXG4gICAgYW51bS5jZW50ZXIoYXJlY3QuY3goKSwgYXJlY3QuY3koKSlcbiAgIyBjcmVhdGUgbGV2ZWwgbGluZXNcbiAgbGV2ZWxfbGluZXMgPSBbXVxuICBmb3IgZCBpbiBbMCAuLiB0cmVlX2hlaWdodF1cbiAgICBsZHggPSBNYXRoLnBvdygyLGQpICogYmJveC53aWR0aFxuICAgIGx4ID0gbGR4IC0gYmJveC53aWR0aFxuICAgIGx5ID0gMipiYm94LmhlaWdodCArIDNcbiAgICBsaW5lID0gbGV2ZWxfZ3JvdXAubGluZShseCsyLGx5LGx4K2xkeC00LGx5KS5zdHJva2UoY29sb3I6JyMwMDAnLHdpZHRoOjIpXG4gICAgbGV2ZWxfbGluZXMucHVzaChsaW5lKVxuICBmbGF0X2hlaWdodCA9IDMgKiBiYm94LmhlaWdodFxuICAjIyMjIyMjIyBzdGFnZ2VyZWQgYXJyYXkgZ3JhcGhpY3MgIyMjIyMjIyNcbiAgc3RhZ190b3AgPSBmbGF0X2hlaWdodFxuICBzdGFnX2dyb3VwID0gZHJhdy5ncm91cCgpXG4gIHN0YWdfZWRnZV9ncm91cCA9IHN0YWdfZ3JvdXAuZ3JvdXAoKVxuICBzdGFnX251bV9ncm91cCA9IHN0YWdfZ3JvdXAuZ3JvdXAoKS5hZnRlcihzdGFnX2VkZ2VfZ3JvdXApXG4gIHN0YWdfcmVjdF9ncm91cCA9IHN0YWdfZ3JvdXAuZ3JvdXAoKS5iZWZvcmUoc3RhZ19udW1fZ3JvdXApXG4gIHN0YWdfbnVtcyA9IChudWxsIGZvciB2IGluIEEpXG4gIGZvciB2LGkgaW4gQVxuICAgIGcgPSBzdGFnX251bV9ncm91cC5ncm91cCgpXG4gICAgY29sb3IgPSBpbl9jb2xvcnNbaV0gIyBvdXRfY29sb3JcbiAgICB0YyA9IGcucmVjdChiYm94LndpZHRoLCBiYm94LmhlaWdodClcbiAgICAgICAgICAuZmlsbChjb2xvcilcbiAgICB0dCA9IGcudGV4dChcIlwiICsgdikuY2VudGVyKHRjLmN4KCksIHRjLmN5KCkpXG4gICAgc3RhZ19udW1zW2ldID0gZ1xuICBzdGFnX3JlY3RzID0gKHN0YWdfcmVjdF9ncm91cC5yZWN0KGJib3gud2lkdGgsIGJib3guaGVpZ2h0KSBmb3IgdiBpbiBBKVxuICBzdGFnX2VkZ2VzID0gKG51bGwgZm9yIHYgaW4gQSlcbiAgZm9yIHYsaSBpbiBBXG4gICAgY29sb3IgPSBpbl9jb2xvcnNbaV0gIyBvdXRfY29sb3JcbiAgICBzbnVtID0gc3RhZ19udW1zW2ldXG4gICAgc3JlY3QgPSBzdGFnX3JlY3RzW2ldXG4gICAgc3ggPSBiYm94LndpZHRoICogaVxuICAgIHN5ID0gc3RhZ190b3AgKyBpbmRleF9kZXB0aChpKSAqIDEuNzUgKiBiYm94LmhlaWdodFxuICAgIHNyZWN0Lm1vdmUoc3gsc3kpLmZpbGwob3BhY2l0eTowKS5zdHJva2UoJyNmZmYnKVxuICAgIHNudW0uY2VudGVyKHNyZWN0LmN4KCksIHNyZWN0LmN5KCkpXG4gICAgaWYgaSA+IDBcbiAgICAgIHAgPSBwYXJlbnRfaW5kZXgoaSlcbiAgICAgIHByZWN0ID0gc3RhZ19yZWN0c1twXVxuICAgICAgc3RhZ19lZGdlc1tpXSA9IHN0YWdfZWRnZV9ncm91cC5saW5lKHNyZWN0LmN4KCksIHNyZWN0LmN5KCksIHByZWN0LmN4KCksIHByZWN0LmN5KCkpLnN0cm9rZShjb2xvcjonIzg4OCcsd2lkdGg6MSkjLmhpZGUoKVxuICBzdGFnX2hlaWdodCA9ICgxICsgMS43NSAqIGluZGV4X2RlcHRoKEEubGVuZ3RoLTEpKSAqIGJib3guaGVpZ2h0XG4gICMjIyMjIyMjIHRyZWUgZ3JhcGhpY3MgIyMjIyMjIyNcbiAgdHJlZV90b3AgPSBzdGFnX3RvcCArIHN0YWdfaGVpZ2h0ICsgOFxuICB0cmVlX2dyb3VwID0gZHJhdy5ncm91cCgpXG4gIHRyZWVfZWRnZV9ncm91cCA9IHRyZWVfZ3JvdXAuZ3JvdXAoKVxuICB0cmVlX2NpcmNsZV9ncm91cCA9IHRyZWVfZ3JvdXAuZ3JvdXAoKVxuICB0cmVlX251bV9ncm91cCA9IHRyZWVfZ3JvdXAuZ3JvdXAoKVxuICBjYm94ID0gKHdpZHRoOihiYm94LndpZHRoKjMpLy8yLCBoZWlnaHQ6KGJib3guaGVpZ2h0KjMpLy8yKVxuICB0cmVlX251bXMgPSAobnVsbCBmb3IgdiBpbiBBKVxuICBmb3IgdixpIGluIEFcbiAgICBnID0gdHJlZV9udW1fZ3JvdXAuZ3JvdXAoKVxuICAgIGNvbG9yID0gaW5fY29sb3JzW2ldICMgb3V0X2NvbG9yXG4gICAgdGMgPSBnLmNpcmNsZShjYm94LndpZHRoLCBjYm94LmhlaWdodClcbiAgICAgICAgICAuZmlsbChjb2xvcilcbiAgICB0dCA9IGcudGV4dChcIlwiICsgdikuY2VudGVyKHRjLmN4KCksIHRjLmN5KCkpXG4gICAgdHJlZV9udW1zW2ldID0gZ1xuICB0cmVlX2NpcmNsZXMgPSAodHJlZV9jaXJjbGVfZ3JvdXAuY2lyY2xlKGNib3gud2lkdGgsIGNib3guaGVpZ2h0KSBmb3IgdiBpbiBBKVxuICB0cmVlX2VkZ2VzID0gKG51bGwgZm9yIHYgaW4gQSlcbiAgIyBwb3NpdGlvbiB0cmVlIGVsZW1lbnRzXG4gIHRyZWVfbGV2ZWxzID0gKFtdIGZvciBkIGluIFswLi50cmVlX2hlaWdodF0pXG4gIGZvciBpIGluIFswLi4uQS5sZW5ndGhdXG4gICAgdHJlZV9sZXZlbHNbaW5kZXhfZGVwdGgoaSldLnB1c2goaSlcbiAgZm9yIGxldmVsLGQgaW4gdHJlZV9sZXZlbHNcbiAgICBoID0gKHRyZWVfaGVpZ2h0IC0gZCArIDEpICNpbmRleF9oZWlnaHQoaSwgQS5sZW5ndGgpXG4gICAgeF9vZmZzZXQgPSBNYXRoLnBvdygyLGgtMikgKiAoOCArIGNib3gud2lkdGgpXG4gICAgeF9zcGFjaW5nID0gTWF0aC5wb3coMixoLTEpICogKDggKyBjYm94LndpZHRoKVxuICAgIGZvciBpLGxpIGluIGxldmVsXG4gICAgICB0bnVtID0gdHJlZV9udW1zW2ldXG4gICAgICB0Y2lyYyA9IHRyZWVfY2lyY2xlc1tpXVxuICAgICAgIyBwbGFjZSB0cmVlIG5vZGVcbiAgICAgIHR4ID0geF9vZmZzZXQgKyBsaSAqIHhfc3BhY2luZ1xuICAgICAgdHkgPSB0cmVlX3RvcCArIGQgKiBjYm94LmhlaWdodFxuICAgICAgdGNpcmMuZmlsbChvcGFjaXR5OjApXG4gICAgICAgICAgIC5zdHJva2Uob3BhY2l0eTowKSMoJyNmZmYnKVxuICAgICAgICAgICAubW92ZSh0eCx0eSlcbiAgICAgIHRudW0uY2VudGVyKHRjaXJjLmN4KCksIHRjaXJjLmN5KCkpXG4gICAgICAjIHBsYWNlIHBhcmVudCBlZGdlXG4gICAgICBpZiBpID4gMFxuICAgICAgICBwID0gcGFyZW50X2luZGV4KGkpXG4gICAgICAgIHBjaXJjID0gdHJlZV9jaXJjbGVzW3BdXG4gICAgICAgIHRyZWVfZWRnZXNbaV0gPSB0cmVlX2VkZ2VfZ3JvdXAubGluZShwY2lyYy5jeCgpLCBwY2lyYy5jeSgpLCB0Y2lyYy5jeCgpLCB0Y2lyYy5jeSgpKS5zdHJva2UoJyM4ODgnKS5oaWRlKClcbiAgdHJlZV9ib3QgPSB0cmVlX3RvcCArICh0cmVlX2hlaWdodCArIDEpICogY2JveC5oZWlnaHRcbiAgIyBjcmVhdGUgcG9pbnRlcnNcbiAgcHRycyA9IGluaXRfcG9pbnRlcnMoZHJhdywgYmJveCwgY2JveClcbiAgIyBzZXQgdGhlIHZpZXdib3ggdG8gYmUganVzdCB0aGUgbWF0cml4XG4gIHNwYWNpbmcgPSAzXG4gIHZpZXdfaGVpZ2h0ID0gdHJlZV9ib3RcbiAgZHJhdy52aWV3Ym94KHg6LTQsIHk6LTQsIHdpZHRoOiA4ICsgYmJveC53aWR0aCAqICgxICsgQS5sZW5ndGgpLCBoZWlnaHQ6IDggKyB2aWV3X2hlaWdodClcbiAgZHJhdy5zaXplKDEyICsgYmJveC53aWR0aCAqIEEubGVuZ3RoLCAxMiArIHZpZXdfaGVpZ2h0KVxuICAjIHJldHVybiBpbmZvXG4gIHJldHVybiAoXG4gICAgYmJveDogYmJveCxcbiAgICBjYm94OiBjYm94LFxuICAgIHB0cnM6IHB0cnMsXG4gICAgaW5fY29sb3JzOiBpbl9jb2xvcnMsXG4gICAgdHJlZV9wYXRoOiBbXSxcbiAgICBoZWFwX3NpemU6IDAsXG4gICAgaGVhcDogKChcbiAgICAgIHZhbHVlOiBBW2ldLFxuICAgICAgY2VsbDoobnVtOmFycmF5X251bXNbaV0sIHJlY3Q6YXJyYXlfcmVjdHNbaV0pLFxuICAgICAgc3RhZzoobnVtOnN0YWdfbnVtc1tpXSwgcmVjdDpzdGFnX3JlY3RzW2ldLCBwYXJlbnRfZWRnZTpzdGFnX2VkZ2VzW2ldKSxcbiAgICAgIG5vZGU6KG51bTp0cmVlX251bXNbaV0sIGNpcmNsZTp0cmVlX2NpcmNsZXNbaV0sIHBhcmVudF9lZGdlOnRyZWVfZWRnZXNbaV0pXG4gICAgKSBmb3IgaSBpbiBbMCAuLi4gQS5sZW5ndGhdKSlcblxuaW5pdF9wb2ludGVycyA9IChkcmF3LCBiYm94LCBjYm94KSAtPlxuICAjIG1ha2UgcHRycyBpbnRvIGNlbGxzIG9mIGFycmF5XG4gIG1ha2VfY2VsbF9wdHIgPSAobGFiZWwsIGJlbG93ID0gZmFsc2UpIC0+XG4gICAgZyA9IGRyYXcuZ3JvdXAoKVxuICAgIHIgPSBnLnJlY3QoYmJveC53aWR0aCwgYmJveC5oZWlnaHQpXG4gICAgICAgICAuZmlsbChvcGFjaXR5OjApXG4gICAgICAgICAuc3Ryb2tlKCcjMDAwJylcbiAgICAgICAgIC5tb3ZlKDAsIGJib3guaGVpZ2h0KVxuICAgIHRvZmZzZXQgPSBiYm94LmhlaWdodCAqIChpZiBiZWxvdyB0aGVuIDEgZWxzZSAtMSlcbiAgICB0ID0gZy50ZXh0KGxhYmVsKS5mb250KGZhbWlseTpcIk1vbm9zcGFjZVwiLHNpemU6MjApXG4gICAgICAgICAuY2VudGVyKHIuY3goKSwgci5jeSgpICsgdG9mZnNldClcbiAgICBnLmhpZGUoKVxuICAgIHJldHVybiBnXG4gIGNlbGxfcHRycyA9IChpOm1ha2VfY2VsbF9wdHIoXCJpXCIpLCByOm1ha2VfY2VsbF9wdHIoXCJyXCIpLCBsOm1ha2VfY2VsbF9wdHIoXCJsXCIpLCBwOm1ha2VfY2VsbF9wdHIoXCJwXCIpLCBuOm1ha2VfY2VsbF9wdHIoXCJuXCIsdHJ1ZSkpXG4gICMgbWFrZSBwdHJzIGZvciBzdGFnZ2VyZWQgYXJyYXlcbiAgbWFrZV9zdGFnX3B0ciA9IChsYWJlbCkgLT5cbiAgICByID0gZHJhdy5yZWN0KGJib3gud2lkdGgsIGJib3guaGVpZ2h0KVxuICAgICAgICAgICAgLmZpbGwob3BhY2l0eTowKVxuICAgICAgICAgICAgLnN0cm9rZShjb2xvcjonIzAwMCcsd2lkdGg6KGlmIGxhYmVsID09IFwiaVwiIHRoZW4gNCBlbHNlIDIpKVxuICAgICAgICAgICAgLm1vdmUoMCwgYmJveC5oZWlnaHQpXG4gICAgci5oaWRlKClcbiAgICByZXR1cm4gclxuICBzdGFnX3B0cnMgPSAoaTptYWtlX3N0YWdfcHRyKFwiaVwiKSwgcjptYWtlX3N0YWdfcHRyKFwiclwiKSwgbDptYWtlX3N0YWdfcHRyKFwibFwiKSwgcDptYWtlX3N0YWdfcHRyKFwicFwiKSwgbjptYWtlX3N0YWdfcHRyKFwiblwiKSlcbiAgIyBtYWtlIHB0cnMgaW50byBub2RlcyBvZiB0cmVlXG4gIG1ha2Vfbm9kZV9wdHIgPSAobGFiZWwpIC0+XG4gICAgYyA9IGRyYXcuY2lyY2xlKGNib3gud2lkdGgsIGNib3guaGVpZ2h0KVxuICAgICAgICAgICAgLmZpbGwob3BhY2l0eTowKVxuICAgICAgICAgICAgLnN0cm9rZShjb2xvcjonIzAwMCcsd2lkdGg6KGlmIGxhYmVsID09IFwiaVwiIHRoZW4gNCBlbHNlIDIpKVxuICAgIGMuaGlkZSgpXG4gICAgcmV0dXJuIGNcbiAgbm9kZV9wdHJzID0gKGk6bWFrZV9ub2RlX3B0cihcImlcIiksIHI6bWFrZV9ub2RlX3B0cihcInJcIiksIGw6bWFrZV9ub2RlX3B0cihcImxcIiksIHA6bWFrZV9ub2RlX3B0cihcInBcIikpXG4gIHJldHVybiAoY2VsbDpjZWxsX3B0cnMsIHN0YWc6c3RhZ19wdHJzLCBub2RlOm5vZGVfcHRycylcblxuZHVyX2luZGV4ID0gMFxuZHVyYXRpb25zID0gW1xuICAoc3dhcDoxMDAwLCBwdHI6NjAwLCBuYW1lOlwiMXggU3BlZWRcIilcbiAgKHN3YXA6NTAwLCBwdHI6MzAwLCBuYW1lOlwiMnggU3BlZWRcIiksXG4gIChzd2FwOjIwMCwgcHRyOjUwLCBuYW1lOlwiNXggU3BlZWRcIiksXG4gIChzd2FwOjUwLCBwdHI6MTAsIG5hbWU6XCIyMHggU3BlZWRcIilcbl1cbndpbmRvdy50b2dnbGVfdHVyYm8gPSAoKSAtPlxuICBkdXJfaW5kZXggPSAoZHVyX2luZGV4ICsgMSkgJSBkdXJhdGlvbnMubGVuZ3RoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHVyYm8tYnV0dG9uXCIpLmlubmVySFRNTCA9IGR1cmF0aW9uc1tkdXJfaW5kZXhdLm5hbWVcblxuYWRkX3RvX3RyZWVfcGF0aCA9IChkcmF3LCBpbmZvLCBpKSAtPlxuICBpbmZvLnRyZWVfcGF0aC5wdXNoKGkpXG4gIGluZm8uaGVhcFtpXS5ub2RlLmNpcmNsZS5zdHJva2UoY29sb3I6JyM0NDQnLCBvcGFjaXR5OjEsIHdpZHRoOjUpXG5jbGVhcl90cmVlX3BhdGggPSAoaW5mbykgLT5cbiAgZm9yIGkgaW4gaW5mby50cmVlX3BhdGhcbiAgICBpbmZvLmhlYXBbaV0ubm9kZS5jaXJjbGUuc3Ryb2tlKG9wYWNpdHk6MClcbiAgaW5mby50cmVlX3BhdGggPSBbXVxuXG5hbmltX29yX2FwcGVhciA9IChvYmosIGR1cikgLT5cbiAgaWYgb2JqLnZpc2libGUoKVxuICAgIHJldHVybiBvYmouYW5pbWF0ZShkdXIpXG4gIGVsc2VcbiAgICByZXR1cm4gb2JqLnNob3coKVxuXG5kb19zdGVwID0gKGRyYXcsIGluZm8sIHN0ZXApIC0+XG4gICMgZGVmaW5lIGNvbnZlbmllbmNlIGZ1bmN0aW9uc1xuICBwdXRfcHRyID0gKG5hbWUpIC0+XG4gICAgZHVyID0gZHVyYXRpb25zW2R1cl9pbmRleF0ucHRyXG4gICAgIyBmbGF0IGFycmF5XG4gICAgYW5pbV9vcl9hcHBlYXIoaW5mby5wdHJzLmNlbGxbbmFtZV0sIGR1cikueChzdGVwLnRvW25hbWVdICogaW5mby5iYm94LndpZHRoKVxuICAgICMgc3RhZ2dlcmVkIGFycmF5XG4gICAgaWYgc3RlcC50b1tuYW1lXSA8IGluZm8uaGVhcC5sZW5ndGhcbiAgICAgIGVsZW0gPSBpbmZvLmhlYXBbc3RlcC50b1tuYW1lXV0uc3RhZy5yZWN0XG4gICAgICBhbmltX29yX2FwcGVhcihpbmZvLnB0cnMuc3RhZ1tuYW1lXSwgZHVyKS5tb3ZlKGVsZW0ueCgpLCBlbGVtLnkoKSlcbiAgICAjIHRyZWVcbiAgICBlbGVtID0gaW5mby5oZWFwW3N0ZXAudG9bbmFtZV1dLm5vZGUuY2lyY2xlXG4gICAgYW5pbV9vcl9hcHBlYXIoaW5mby5wdHJzLm5vZGVbbmFtZV0sIGR1cikubW92ZShlbGVtLngoKSwgZWxlbS55KCkpXG4gIGhpZGVfcHRyID0gKG5hbWUpIC0+XG4gICAgaW5mby5wdHJzLmNlbGxbbmFtZV0uaGlkZSgpXG4gICAgaW5mby5wdHJzLnN0YWdbbmFtZV0uaGlkZSgpXG4gICAgaW5mby5wdHJzLm5vZGVbbmFtZV0uaGlkZSgpXG4gIGNvbG9yX3BhcmVudF9lZGdlID0gKHAsaSkgLT5cbiAgICBpZiBpICE9IHBcbiAgICAgIGVpID0gaW5mby5oZWFwW2ldXG4gICAgICBlaS5zdGFnLnBhcmVudF9lZGdlLnN0cm9rZShjb2xvcjogJyM4ODgnLCB3aWR0aDoxKVxuICAgICAgaWYgaSA8IGluZm8uaGVhcF9zaXplXG4gICAgICAgIGVwID0gaW5mby5oZWFwW3BdXG4gICAgICAgIGVpLm5vZGUucGFyZW50X2VkZ2Uuc2hvdygpXG4gICAgICAgIGlmIGVpLnZhbHVlID4gZXAudmFsdWUgIyB2aW9sYXRlcyBoZWFwIHByb3BlcnR5XG4gICAgICAgICAgZWkubm9kZS5wYXJlbnRfZWRnZS5zdHJva2UoY29sb3I6ICcjZjAwJywgd2lkdGg6NClcbiAgICAgICAgICBlaS5zdGFnLnBhcmVudF9lZGdlLnN0cm9rZShjb2xvcjogJyNmMDAnLCB3aWR0aDo0KVxuICAgICAgICBlbHNlICMgc2F0aXNmaWVzIGhlYXAgcHJvcGVydHlcbiAgICAgICAgICBlaS5ub2RlLnBhcmVudF9lZGdlLnN0cm9rZShjb2xvcjogJyM4ODgnLCB3aWR0aDoxKVxuICAgICAgZWxzZVxuICAgICAgICBlaS5ub2RlLnBhcmVudF9lZGdlLmhpZGUoKVxuICBjb2xvcl9lZGdlcyA9IChpKSAtPlxuICAgIFtwLGwscl0gPSBbcGFyZW50X2luZGV4KGkpLCBsZWZ0X2luZGV4KGksaW5mby5oZWFwX3NpemUpLCByaWdodF9pbmRleChpLGluZm8uaGVhcF9zaXplKV1cbiAgICBjb2xvcl9wYXJlbnRfZWRnZShwLGkpXG4gICAgY29sb3JfcGFyZW50X2VkZ2UoaSxsKVxuICAgIGNvbG9yX3BhcmVudF9lZGdlKGkscilcbiAgXG4gIHN3aXRjaCBzdGVwLmFjdFxuICAgIHdoZW4gQWN0Lm5vbmUgdGhlbiB0cnVlXG4gICAgd2hlbiBBY3Quc2V0X25cbiAgICAgIGluZm8uaGVhcF9zaXplID0gc3RlcC50b1xuICAgICAgYW5pbV9vcl9hcHBlYXIoaW5mby5wdHJzLmNlbGwubiwgZHVyYXRpb25zW2R1cl9pbmRleF0ucHRyKS54KHN0ZXAudG8gKiBpbmZvLmJib3gud2lkdGgpXG4gICAgICBpZiBzdGVwLnRvID4gc3RlcC5mcm9tICMgaW5jcmVhc2VcbiAgICAgICAgZm9yIGkgaW4gW3N0ZXAuZnJvbSAuLi4gc3RlcC50b11cbiAgICAgICAgICBjb2xvcl9lZGdlcyhpKVxuICAgICAgZWxzZSAjIGRlY3JlYXNlXG4gICAgICAgIGZvciBpIGluIFtzdGVwLnRvIC4uLiBzdGVwLmZyb21dXG4gICAgICAgICAgY29sb3JfZWRnZXMoaSlcbiAgICB3aGVuIEFjdC5zZXRfbWhkXG4gICAgICBpZiBzdGVwLnRvP1xuICAgICAgICBwdXRfcHRyKFwiaVwiKVxuICAgICAgICBhZGRfdG9fdHJlZV9wYXRoKGRyYXcsIGluZm8sIHN0ZXAudG8uaSlcbiAgICAgICAgaWYgc3RlcC50by5sID09IHN0ZXAudG8uaVxuICAgICAgICAgIGhpZGVfcHRyKFwibFwiKVxuICAgICAgICAgIGhpZGVfcHRyKFwiclwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcHV0X3B0cihcImxcIilcbiAgICAgICAgICBpZiBzdGVwLnRvLnIgPT0gc3RlcC50by5pXG4gICAgICAgICAgICBoaWRlX3B0cihcInJcIilcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBwdXRfcHRyKFwiclwiKVxuICAgICAgZWxzZVxuICAgICAgICAgIGhpZGVfcHRyKFwiaVwiKVxuICAgICAgICAgIGhpZGVfcHRyKFwibFwiKVxuICAgICAgICAgIGhpZGVfcHRyKFwiclwiKVxuICAgIHdoZW4gQWN0LnNldF9taHUgIyAoaTppLHA6cClcbiAgICAgIGlmIHN0ZXAudG8/XG4gICAgICAgIHB1dF9wdHIoXCJpXCIpXG4gICAgICAgIGFkZF90b190cmVlX3BhdGgoZHJhdywgaW5mbywgc3RlcC50by5pKVxuICAgICAgICBpZiBzdGVwLnRvLnAgPT0gc3RlcC50by5pXG4gICAgICAgICAgaGlkZV9wdHIoXCJwXCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwdXRfcHRyKFwicFwiKVxuICAgICAgZWxzZVxuICAgICAgICBoaWRlX3B0cihcImlcIilcbiAgICAgICAgaGlkZV9wdHIoXCJwXCIpXG4gICAgd2hlbiBBY3Quc3dhcFxuICAgICAgZWkgPSBpbmZvLmhlYXBbc3RlcC5pXVxuICAgICAgZWogPSBpbmZvLmhlYXBbc3RlcC5qXVxuICAgICAgZHVyID0gZHVyYXRpb25zW2R1cl9pbmRleF0uc3dhcFxuICAgICAgIyBzd2FwIGluIGFycmF5XG4gICAgICBlaS5jZWxsLm51bS5hbmltYXRlKGR1cikuY2VudGVyKGVqLmNlbGwucmVjdC5jeCgpLCBlai5jZWxsLnJlY3QuY3koKSlcbiAgICAgIGVqLmNlbGwubnVtLmFuaW1hdGUoZHVyKS5jZW50ZXIoZWkuY2VsbC5yZWN0LmN4KCksIGVpLmNlbGwucmVjdC5jeSgpKVxuICAgICAgZWkuY2VsbC5yZWN0LmFuaW1hdGUoZHVyKS5maWxsKGluZm8uaW5fY29sb3JzW3N0ZXAual0pXG4gICAgICBlai5jZWxsLnJlY3QuYW5pbWF0ZShkdXIpLmZpbGwoaW5mby5pbl9jb2xvcnNbc3RlcC5pXSlcbiAgICAgICMgc3dhcCBpbiBzdGFnZ2VyZWQgYXJyYXlcbiAgICAgIGVpLnN0YWcubnVtLmFuaW1hdGUoZHVyKS5jZW50ZXIoZWouc3RhZy5yZWN0LmN4KCksIGVqLnN0YWcucmVjdC5jeSgpKVxuICAgICAgZWouc3RhZy5udW0uYW5pbWF0ZShkdXIpLmNlbnRlcihlaS5zdGFnLnJlY3QuY3goKSwgZWkuc3RhZy5yZWN0LmN5KCkpXG4gICAgICAjIHN3YXAgaW4gdHJlZVxuICAgICAgZWkubm9kZS5udW0uYW5pbWF0ZShkdXIpLmNlbnRlcihlai5ub2RlLmNpcmNsZS5jeCgpLCBlai5ub2RlLmNpcmNsZS5jeSgpKVxuICAgICAgZWoubm9kZS5udW0uYW5pbWF0ZShkdXIpLmNlbnRlcihlaS5ub2RlLmNpcmNsZS5jeCgpLCBlaS5ub2RlLmNpcmNsZS5jeSgpKVxuICAgICAgZWkubm9kZS5jaXJjbGUuYW5pbWF0ZShkdXIpLmZpbGwoaW5mby5pbl9jb2xvcnNbc3RlcC5qXSlcbiAgICAgIGVqLm5vZGUuY2lyY2xlLmFuaW1hdGUoZHVyKS5maWxsKGluZm8uaW5fY29sb3JzW3N0ZXAuaV0pXG4gICAgICAjIHN3YXAgaW4gaW5mb1xuICAgICAgW2VpLnZhbHVlLCBlai52YWx1ZV0gPSBbZWoudmFsdWUsIGVpLnZhbHVlXVxuICAgICAgW2VpLmNlbGwubnVtLCBlai5jZWxsLm51bV0gPSBbZWouY2VsbC5udW0sIGVpLmNlbGwubnVtXVxuICAgICAgW2VpLnN0YWcubnVtLCBlai5zdGFnLm51bV0gPSBbZWouc3RhZy5udW0sIGVpLnN0YWcubnVtXVxuICAgICAgW2VpLm5vZGUubnVtLCBlai5ub2RlLm51bV0gPSBbZWoubm9kZS5udW0sIGVpLm5vZGUubnVtXVxuICAgICAgW2luZm8uaW5fY29sb3JzW3N0ZXAuaV0sIGluZm8uaW5fY29sb3JzW3N0ZXAual1dID0gW2luZm8uaW5fY29sb3JzW3N0ZXAual0sIGluZm8uaW5fY29sb3JzW3N0ZXAuaV1dXG4gICAgICBjb2xvcl9lZGdlcyhzdGVwLmkpXG4gICAgICBjb2xvcl9lZGdlcyhzdGVwLmopXG4gICAgd2hlbiBBY3QuY2xlYXJfcGF0aFxuICAgICAgY2xlYXJfdHJlZV9wYXRoKGluZm8pXG4gIHRydWVcblxuIyBhdXRvcnVuIGNvbnRyb2xzXG5hdXRvcnVuID0gMFxuYXV0b3J1bl9kdXIgPSAoKSAtPiBNYXRoLm1heChkdXJhdGlvbnNbZHVyX2luZGV4XS5zd2FwLCBkdXJhdGlvbnNbZHVyX2luZGV4XS5wdHIpXG5idXR0b25zX2VkaXRfcGxheWluZyA9ICgpIC0+XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheS1idXR0b25cIikuaW5uZXJIVE1MID0gXCJQYXVzZVwiXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV4dC1idXR0b25cIikuZGlzYWJsZWQgPSBcInRydWVcIlxuYnV0dG9uc19lZGl0X3N0b3BwZWQgPSAoKSAtPlxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXktYnV0dG9uXCIpLmlubmVySFRNTCA9IFwiUGxheVwiXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV4dC1idXR0b25cIikuZGlzYWJsZWQgPSBudWxsXG4jIHN0YXJ0L3N0b3AgcGxheVxud2luZG93LmNsaWNrX3BsYXkgPSAoKSAtPlxuICBzd2l0Y2ggYXV0b3J1blxuICAgIHdoZW4gMCAjIHBhdXNlZFxuICAgICAgYXV0b3J1biA9IDFcbiAgICAgIGJ1dHRvbnNfZWRpdF9wbGF5aW5nKClcbiAgICAgIGF1dG9ydW5fbG9vcCgpXG4gICAgd2hlbiAxICMgYWxyZWFkeSBwbGF5aW5nXG4gICAgICBhdXRvcnVuID0gMFxuIyBsb29wXG5hdXRvcnVuX2xvb3AgPSAoKSAtPlxuICBkdXIgPSBhdXRvcnVuX2R1cigpXG4gIGlmIGF1dG9ydW4gPT0gMSBhbmQgd2luZG93LmNsaWNrX25leHQoKVxuICAgIGJ1dHRvbnNfZWRpdF9wbGF5aW5nKClcbiAgICBzdGF0ZS5kcmF3LmFuaW1hdGUoZHVyYXRpb246ZHVyKS5hZnRlcigoKSAtPiBhdXRvcnVuX2xvb3AoKSlcbiAgZWxzZSBpZiBhdXRvcnVuID09IDBcbiAgICBidXR0b25zX2VkaXRfc3RvcHBlZCgpXG4gIHRydWVcblxuc2V0X2NtZF9idXR0b25zX3VzYWJsZSA9IChjYW5fcHJlc3MpIC0+XG4gIHZhbHVlID0gKGlmIGNhbl9wcmVzcyB0aGVuIG51bGwgZWxzZSBcInRydWVcIilcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbWQtZnVsbC1zaXplXCIpLmRpc2FibGVkID0gdmFsdWVcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbWQtbWh1XCIpLmRpc2FibGVkID0gdmFsdWVcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbWQtc29ydFwiKS5kaXNhYmxlZCA9IHZhbHVlXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY21kLWJ1aWxkXCIpLmRpc2FibGVkID0gdmFsdWVcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbWQtcm12XCIpLmRpc2FibGVkID0gdmFsdWVcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbWQtaW5zXCIpLmRpc2FibGVkID0gdmFsdWVcblxud2luZG93LmNsaWNrX25leHQgPSAoKSAtPlxuICBpZiBzdGF0ZS5nZW4/XG4gICAgbmV4dCA9IHN0YXRlLmdlbi5uZXh0KClcbiAgICBpZiBuZXh0LmRvbmVcbiAgICAgIHN0YXRlLmdlbiA9IG51bGxcbiAgICAgIHNldF9jbWRfYnV0dG9uc191c2FibGUodHJ1ZSlcbiAgICBlbHNlXG4gICAgICBkb19zdGVwKHN0YXRlLmRyYXcsIHN0YXRlLmluZm8sIG5leHQudmFsdWUpXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1zZ1wiKS5pbm5lckhUTUwgPSBuZXh0LnZhbHVlLm1zZ1xuICAgICAgc2V0X2NtZF9idXR0b25zX3VzYWJsZShmYWxzZSlcbiAgICB0cnVlXG4gIGVsc2VcbiAgICBmYWxzZVxuXG53aW5kb3cuY2xpY2tfZXh0cmFjdF9tYXggPSAoKSAtPlxuICBpZiBzdGF0ZS5nZW4/XG4gICAgdHJ1ZSAjIGFub3RoZXIgb3BlcmF0aW9uIGlzIG9uLWdvaW5nXG4gIGVsc2VcbiAgICBjbGVhcl90cmVlX3BhdGgoc3RhdGUuaW5mbylcbiAgICBzdGF0ZS5nZW4gPSBoZWFwX2V4dHJhY3RfbWF4KHN0YXRlLkEsIHN0YXRlLmluZm8uaGVhcF9zaXplKVxuICAgIGF1dG9ydW4gPSAxXG4gICAgYXV0b3J1bl9sb29wKCkgI3dpbmRvdy5jbGlja19uZXh0KClcblxud2luZG93LmNsaWNrX2luc2VydCA9ICgpIC0+XG4gIGlmIHN0YXRlLmdlbj9cbiAgICB0cnVlICMgYW5vdGhlciBvcGVyYXRpb24gaXMgb24tZ29pbmdcbiAgZWxzZVxuICAgIGNsZWFyX3RyZWVfcGF0aChzdGF0ZS5pbmZvKVxuICAgIHN0YXRlLmdlbiA9IGhlYXBfaW5zZXJ0KHN0YXRlLkEsIHN0YXRlLmluZm8uaGVhcF9zaXplKVxuICAgIGF1dG9ydW4gPSAxXG4gICAgYXV0b3J1bl9sb29wKCkgI3dpbmRvdy5jbGlja19uZXh0KClcblxud2luZG93LmNsaWNrX2Z1bGxfc2l6ZSA9ICgpIC0+XG4gIGlmIHN0YXRlLmdlbj9cbiAgICB0cnVlICMgYW5vdGhlciBvcGVyYXRpb24gaXMgb24tZ29pbmdcbiAgZWxzZVxuICAgIGdlbmVyYXRvciA9ICgpIC0+IHlpZWxkIChhY3Q6QWN0LnNldF9uLCBmcm9tOnN0YXRlLmluZm8uaGVhcF9zaXplLCB0bzpzdGF0ZS5BLmxlbmd0aCwgbXNnOlwiTWFraW5nIGhlYXAgY29udGFpbiBmdWxsIGFycmF5LlwiKVxuICAgIGNsZWFyX3RyZWVfcGF0aChzdGF0ZS5pbmZvKVxuICAgIHN0YXRlLmdlbiA9IGdlbmVyYXRvcigpXG4gICAgYXV0b3J1biA9IDFcbiAgICBhdXRvcnVuX2xvb3AoKSAjd2luZG93LmNsaWNrX25leHQoKVxuXG53aW5kb3cuY2xpY2tfbWF4X2hlYXBpZnlfZG93biA9ICgpIC0+XG4gIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0cmlja2xlLWluZGV4XCIpLnZhbHVlXG4gIGkgPSBNYXRoLmFicyhpbnB1dClcbiAgaWYgXCJudW1iZXJcIiA9PSB0eXBlb2YgaSBhbmQgMCA8PSBpIGFuZCBpIDwgc3RhdGUuaW5mby5oZWFwX3NpemVcbiAgICBpZiBzdGF0ZS5nZW4/ICMgYW5vdGhlciBvcGVyYXRpb24gaXMgb25nb2luZ1xuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGNsZWFyX3RyZWVfcGF0aChzdGF0ZS5pbmZvKVxuICAgICAgc3RhdGUuZ2VuID0gbWF4X2hlYXBpZnlfZG93bihzdGF0ZS5BLCBzdGF0ZS5pbmZvLmhlYXBfc2l6ZSwgaSwgbnVsbClcbiAgICAgIGF1dG9ydW4gPSAxXG4gICAgICBhdXRvcnVuX2xvb3AoKVxuXG53aW5kb3cuY2xpY2tfaGVhcF9zb3J0ID0gKCkgLT5cbiAgaWYgc3RhdGUuZ2VuPyAjIGFub3RoZXIgb3BlcmF0aW9uIGlzIG9uZ29pbmdcbiAgICB0cnVlXG4gIGVsc2VcbiAgICBjbGVhcl90cmVlX3BhdGgoc3RhdGUuaW5mbylcbiAgICBzdGF0ZS5nZW4gPSBoZWFwX3NvcnQoc3RhdGUuQSlcbiAgICBhdXRvcnVuID0gMVxuICAgIGF1dG9ydW5fbG9vcCgpXG5cbndpbmRvdy5jbGlja19idWlsZF9oZWFwID0gKCkgLT5cbiAgaWYgc3RhdGUuZ2VuPyAjIGFub3RoZXIgb3BlcmF0aW9uIGlzIG9uZ29pbmdcbiAgICB0cnVlXG4gIGVsc2VcbiAgICBjbGVhcl90cmVlX3BhdGgoc3RhdGUuaW5mbylcbiAgICBzdGF0ZS5nZW4gPSBidWlsZF9oZWFwKHN0YXRlLkEpXG4gICAgYXV0b3J1biA9IDFcbiAgICBhdXRvcnVuX2xvb3AoKVxuXG5tYWluID0gKCkgLT5cbiAgc3RhdGUuZHJhdyA9IFNWRygnZHJhd2luZycpXG4gIHN0YXRlLmluZm8gPSBpbml0X2RyYXcoc3RhdGUuZHJhdywgc3RhdGUuQSlcbiAgc3RhdGUuZ2VuID0gbnVsbFxuXG5TVkcub24oZG9jdW1lbnQsICdET01Db250ZW50TG9hZGVkJywgbWFpbikiXX0=
//# sourceURL=coffeescript
