(function( window ){

//-------------------------------------------------------------------------------------

var document = window.document,
	docElem = document.documentElement;	//文档根节点

var core_toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty;


var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,
	core_toString = Object.prototype.toString,
	core_push = Array.prototype.push;
	class2type = {};	//

var ralpha = /alpha\([^)]*\)/i,	//匹配如：alpha(opacity=20)
	ropacity = /opacity=([^)]*)/,	//匹配如：filter:alpha(opacity=20)等形式
	// fixed for IE9, see #8346
	rupper = /([A-Z]|^ms)/g,	//此处暂不明，但觉厉，需再探究下
	rnum = /^[\-+]?(?:\d*\.)?\d+$/i,	//匹配数字（包括浮点），如(+/-)1、(+/-)0.1、(+/-).1、(+/-)1.1
	rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,	//非px值，如'10em'、'10%'等
	rrelNum = /^([\-+])=([\-+.\de]+)/,	//设置属性支持相对写法，如$('#header').css('height', '+=10px')等。。
	rmargin = /^margin/,	//属性是否为margin开头的，如margin-left、margin-top等

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },	//对于offsetHeight或offsetWidth为0的元素

	// order is important!
	cssExpand = [ "Top", "Right", "Bottom", "Left" ],	//计算宽、高用到

	curCSS,	//最终只是把getComputedStyle或currentStyle方法其中之一赋给curCss

	getComputedStyle,	//遵守标准的浏览器获取css样式的方法
	currentStyle;	//IE浏览器获取css样式的方法

/* 工具方法*/
var util = window.util = {
	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	//将margin-left形式，转成marginLeft形式
	//比如 -ms-transform、-moz-transform、-webkit-transform
	//IE里读取需用msTransform，ff、chrome下用MozTransform、WebkitTransform，尼玛
	camelCase: function( string ) {
		return string.replace( /^-ms-/, "ms-" )
					.replace( /-([\da-z])/gi, function( all, letter ) {
						return ( letter + "" ).toUpperCase();
					});
	},
	//obj是否function类型
	isFunction: function( obj ){
		return util.type(obj) === "function";
	},
	//obj是否数组类型
	isArray: Array.isArray || function( obj ) {
		return util.type(obj) === "array";
	},
	//obj是否数字
	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},
	//返回obj的数据类型
	type: function( obj ) {
		return obj == null ? String( obj ) : ( class2type[ core_toString.call(obj) ] || "object" );
	},
	//
	each: function( obj, callback, args ) {
		var name,
			i = 0,
			length = obj.length,
			isObj = core_toString.call( obj ) === '[object Object]'

		if ( isObj ) {
			for ( name in obj ) {
				if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
					break;
				}
			}
		} else {
			for ( ; i < length; ) {
				if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},
	
	trim: $.str.trim,
		
	//调用方式：util.contains( parent, child )
	contains : docElem.compareDocumentPosition ?
		function( a, b ) {
			return !!( a.compareDocumentPosition( b ) & 16 );
		} :
		docElem.contains ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && adown.contains && adown.contains(bup) );
		} :
		function( a, b ) {
			while ( (b = b.parentNode) ) {
				if ( b === a ) {
					return true;
				}
			}
			return false;
		}

};
//
util.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});


(function(){
	var support,
		all,
		a,
		select,
		opt,
		input,
		fragment,
		tds,
		events,
		eventName,
		i,
		isSupported,
		div = document.createElement( "div" ),
		documentElement = document.documentElement;

	// Preliminary tests
	div.setAttribute("className", "t");
	div.innerHTML = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";

	all = div.getElementsByTagName( "*" );
	a = div.getElementsByTagName( "a" )[ 0 ];

	// Can't get basic test support
	if ( !all || !all.length || !a ) {	//Q：神马情况？？
		return {};
	}

	// First batch of supports tests
	select = document.createElement( "select" );
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName( "input" )[ 0 ];

	support = {
		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.55/.test( a.style.opacity ),	//是否支持opacity==>IE6/7/8采用filter来实现（半）透明效果，
		
		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,	//（1）IE：node.style.styleFloat（2）chrome等：node.style.cssFloat
		
		reliableMarginRight: true,		//解决webkit的bug：getComputedStyle返回错误的margin-right值
										//解决方案：暂时将节点的display属性设为inline-block
		pixelMargin: true,	//是否支持margin返回的结果是px为单位（webkit里面，如果设置了百分值，则返回百分值），测试了下chrome下是ok的，估计某些特定版本有这问题
		
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: ( div.firstChild.nodeType === 3 ),	//IE6、7、8里面，会将节点前面的空白忽略，IE9、FF、chrome等不会

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,	//@备注：在$.css模块里，这个支持暂时用不到

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: ( a.getAttribute("href") === "/a" ),	//@备注：在$.css模块里，这个支持暂时用不到

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,	//@备注：在$.css模块里，这个支持暂时用不到

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: opt.selected,	//@备注：在$.css模块里，这个支持暂时用不到

		// Make sure that if no value is specified for a checkbox
		// that it defaults to "on".
		// (WebKit defaults to "" instead)
		checkOn: ( input.value === "on" ),	//@备注：在$.css模块里，这个支持暂时用不到

		// Tests for enctype support on a form(#6743)
		enctype: !!document.createElement("form").enctype,	//@备注：在$.css模块里，这个支持暂时用不到

		// Makes sure cloning an html5 element does not cause problems
		// Where outerHTML is undefined, this still works
		html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",	//@备注：在$.css模块里，这个支持暂时用不到

		// Get the style information from getAttribute
		// (IE uses .cssText instead)
		style: /top/.test( a.getAttribute("style") ),	//在IE浏览器里，node.style.cssText获取内敛样式的字符串，如"HEIGHT: 40px; COLOR: red"
														//非IE浏览器，如chrome，node.getAttribute('style')结果为："height:40px;color:red"，node.style结果为：CSSStyleDeclaration对象 = =b

		
		
		

		

		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
		getSetAttribute: div.className !== "t"	//IE7、7里，node.getAttribute('class') =>null , node.getAttribute('className') => workds
												//其他，如chrome，node.getAttribute('class') => works
		
	};

	// jQuery.boxModel DEPRECATED in 1.3, use jQuery.support.boxModel instead
	util.boxModel = support.boxModel = (document.compatMode === "CSS1Compat");	//

	// Run tests that need a body at doc ready
	//@todo：此处检测需在dom ready时进行处理，ready 需进行处理
	$.ready(function() {

		var container, outer, inner, table, td, offsetSupport,
			marginDiv, conMarginTop, style, html, positionTopLeftWidthHeight,
			paddingMarginBorderVisibility, paddingMarginBorder,
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		conMarginTop = 1;
		paddingMarginBorder = "padding:0;margin:0;border:";
		positionTopLeftWidthHeight = "position:absolute;top:0;left:0;width:1px;height:1px;";
		paddingMarginBorderVisibility = paddingMarginBorder + "0;visibility:hidden;";
		style = "style='" + positionTopLeftWidthHeight + paddingMarginBorder + "5px solid #000;";
		html = "<div " + style + "display:block;'><div style='" + paddingMarginBorder + "0;display:block;overflow:hidden;'></div></div>" +
			"<table " + style + "' cellpadding='0' cellspacing='0'>" +
			"<tr><td></td></tr></table>";

		container = document.createElement("div");
		container.style.cssText = paddingMarginBorderVisibility + "width:0;height:0;position:static;top:0;margin-top:" + conMarginTop + "px";
		body.insertBefore( container, body.firstChild );

		// Construct the test element
		div = document.createElement("div");
		container.appendChild( div );

		// Check if div with explicit width and no margin-right incorrectly
		// gets computed margin-right based on width of container. For more
		// info see bug #3333
		// Fails in WebKit before Feb 2011 nightlies
		// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
		if ( window.getComputedStyle ) {	//解决神bug的，不费神了。。
			div.innerHTML = "";
			marginDiv = document.createElement( "div" );
			marginDiv.style.width = "0";
			marginDiv.style.marginRight = "0";
			div.style.width = "2px";
			div.appendChild( marginDiv );
			support.reliableMarginRight =
				( parseInt( ( window.getComputedStyle( marginDiv, null ) || { marginRight: 0 } ).marginRight, 10 ) || 0 ) === 0;
		}


		div.style.cssText = positionTopLeftWidthHeight + paddingMarginBorderVisibility;
		div.innerHTML = html;

		if ( window.getComputedStyle ) {
			div.style.marginTop = "1%";
			support.pixelMargin = ( window.getComputedStyle( div, null ) || { marginTop: 0 } ).marginTop !== "1%";
		}

		if ( typeof container.style.zoom !== "undefined" ) {
			container.style.zoom = 1;
		}

		body.removeChild( container );
		marginDiv = div = container = null;

		$.oop.extend( support, offsetSupport );
	});

	util.support = support;
})();



//
$.oop.extend( util, {
	//此处的属性名需要特殊处理，如float，在IE里为node.style.styleFloat，支持标准的浏览器里为node.style.cssFloat
	cssProps: {
		"float": util.support.cssFloat ? "cssFloat" : "styleFloat"
	},
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	//hook方法，对一些特殊的属性，需要有特殊的样式读取（get）、设置（set）方法
	cssHooks: {
		//@cssHooks1：透明度
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;

				} else {
					return elem.style.opacity;
				}
			}
		}
	},

	// Exclude the following css properties to add px
	//排除一下css属性，无需加px，此处有些疑问，如lineHeight，需再研究下。
	cssNumber: {
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},
	// Get and set the style property on a DOM Node
	/**
	 * @description 读取/设置 dom 节点样式
	 * @param {DOMObject} elem dom节点
	 * @param {String} name 属性值
	 * @param {String|Number} value 样式值
	 * @note 当获取样式值时，返回的是内联样式值，而非浏览器实际渲染后的值
	*/
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		//elem.nodeType ==> 3：文本,8：注释，此处过滤文本、注释节点
		//elem为document，则document.style == undefined，过滤无法设置属性的节点
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, origName = util.camelCase( name ),	//返回驼峰命名形式的属性名
			style = elem.style, hooks = util.cssHooks[ origName ];

		name = util.cssProps[ origName ] || origName;	//float返回cssFloat或styleFloat（目前就只对这个属性进行特殊处理）

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			//采用相对值进行设置，如$(node).css('height','+=10px')
			//ret = rrelNum.exec( value )，如采用相对值进行设置，则：
			//ret[1]：+/-
			//ret[2]：相对值的大小
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( +( ret[1] + 1) * +ret[2] ) + parseFloat( util.css( elem, name ) );	//将相对值与原来的属性值进行运算，获得实际设置的值
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			//如果设置的值为 null 或者 NaN，则不设置，直接返回
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			//如果传进来的值是number类型，如.css('height',10)，则给10加上单位px
			if ( type === "number" && !util.cssNumber[ origName ] ) {
				value += "px";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			//如果该属性存在对应钩子对象，且该对象有set方法，则调用刚set方法设置样式值
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value )) !== undefined ) {
				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
				// Fixes bug #5509
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			//如果value没有提供，jQuery.css返回内联样式值
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}
			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},
	/**
	 * @description 读取 dom 实际渲染的样式值
	 * @param {DOMObject} elem 获取样式的dom节点
	 * @param {String} name 样式名
	 * @param extra 
	*/
	css: function( elem, name, extra ) {
		//
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		var ret, hooks;

		// Make sure that we're working with the right name
		name = util.camelCase( name );	//转成驼峰形式，如margin-left --> marginLeft
		hooks = util.cssHooks[ name ];	//某些特定的属性有对应的get、set方法，如'height'、'width'、'opacity'等
		name = util.cssProps[ name ] || name;	//对某些特殊属性，如float进行修正

		// cssFloat needs a special treatment
		//设置的时候，需 node.style.cssFloat = 'left'
		//读取的时候，需 node.css.cssFloat 或 window.getComputedStyle( node, null ).getPropertyValue( 'float' )
		if ( name === "cssFloat" ) {	//兼容标准的浏览器如chrome，用$(node).css('float')或$(node).css('cssFloat')
			name = "float";
		}

		// If a hook was provided get the computed value from there
		//如果有对应的hook对象，且该对象有get方法，则调用hooks[name].get 来获取样式值
		if ( hooks && "get" in hooks && (ret = hooks.get( elem, true, extra )) !== undefined ) {
			return ret;
		// Otherwise, if a way to get the computed value exists, use that
		} else if ( curCSS ) {	//否则，通过curCSS方法来获取实际渲染后的样式值，curCSS定义见curCSS部分说明
			return curCSS( elem, name );
		}
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	//将offsetHeight、offsetWidth为0的元素快速修改样式，获得需要的值后，再改回去
	//options：{display:'block',position:'absolute',visibility:'hidden'}
	/**
	 * @description 将offsetHeight、offsetWidth为0（可能因display=none等原因导致）的元素快速修改样式，获得浏览器实际渲染的值后，再改回去
	 * @param {DOMObject} elem dom节点
	 * @param {Object} options {display:'block',position:'absolute',visibility:'hidden'}
	 * @param {Function} callback 回调方法，如获取修改后的dom节点的宽、高等
	*/
	swap: function( elem, options, callback ) {
		var old = {},
			ret, name;

		// Remember the old values, and insert the new ones
		for ( name in options ) {	//先将dom元素设置为display=block;position=absolute;visibility=hidden;
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.call( elem );

		// Revert the old values
		for ( name in options ) {	//将改变的display、position、visibiliby设置回去
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

//@cssHooks2：高度、宽度
util.each([ "height", "width" ], function( i, name ) {
	util.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				if ( elem.offsetWidth !== 0 ) {
					return getWidthOrHeight( elem, name, extra );
				} else {
					return util.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					});
				}
			}
		},
		//如果是数字，则返回 value+'px'；否则，返回value
		set: function( elem, value ) {
			return rnum.test( value ) ?
				value + "px" :
				value;
		}
	};
});

//@cssHooks3：透明度
if ( !util.support.opacity ) {	//如果不支持style.opacity，关于support下文有讲到，暂时从字面上理解即可
	util.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?	//IE:是否存在filter:alpha(opacity=30)的样式设置
				( parseFloat( RegExp.$1 ) / 100 ) + "" :	//存在：将opacity转换成小数点形式（与遵守标准的浏览器保持一致），同时 node.style.opacity 返回的是字符串，尼玛！！！这不科学！！
				computed ? "1" : "";	//不存在：未设置opacity，视为全部透明，即1
										//window.getComputedStyle($('whd'), null)['opacity'] 返回的是字符串
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = util.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",	//为IE、非IE保持一致，需要乘以100
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;	//此处为解决IE bug，表示还不知道有这么个bug存在于人世间，重构的兄弟们辛苦了

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			//var ralpha = /alpha\([^)]*\)/i,	//匹配如：alpha(opacity=20)
			if ( value >= 1 && util.trim( filter.replace( ralpha, "" ) ) === "" ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there there is no filter style applied in a css rule, we are done
				if ( currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}


//@cssHooks4：marginRight（右外边距）
//据说是为了处理神bug存在的，就不伤害自己脑细胞了，了解下即可
//@todo: 需在dom ready时进行检测
$.ready(function() {
	// This hook cannot be added until DOM ready because the support test
	// for it is not run until after DOM ready
	if ( !util.support.reliableMarginRight ) {
		util.cssHooks.marginRight = {
			get: function( elem, computed ) {
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// Work around by temporarily setting element display to inline-block
				return util.swap( elem, { "display": "inline-block" }, function() {
					if ( computed ) {
						return curCSS( elem, "margin-right" );
					} else {
						return elem.style.marginRight;
					}
				});
			}
		};
	}
});

// These hooks are used by animate to expand properties
//@cssHooks5：待填坑
util.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {

	util.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i,

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ],
				expanded = {};

			for ( i = 0; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};
});

// DEPRECATED in 1.3, Use jQuery.css() instead
util.curCSS = util.css;

//处理遵守W3C标准的浏览器
//在浏览器里，document.defaultView返回与document相关的window对象，如果不存在，则返回null
//IE9以下版本的IE系列不支持defaultView
//其实可以直接window.getComputedStyle，除了一种情况，见：https://developer.mozilla.org/en-US/docs/DOM/window.getComputedStyle
//@2012-07-27 然后发现，jq 1.8.0 版本去掉这个恶心的的判断了 orz
//getComputedStyle() gives the final used values of all the CSS properties of an element.
//比如样式表里设置font-size:12px，内联样式设置font-size:20px，返回的是20px
if ( window.getComputedStyle ) {	//兼容标准的浏览器
	getComputedStyle = window.getComputedStyle;

	curCSS = function( elem, name ) {
		var ret, width,
			computedStyle = getComputedStyle( elem, null ),
			style = elem.style;
		name = name.replace( rupper, "-$1" ).toLowerCase();	//将属性名转换成margin-left这种带连字符的形式
															//rupper定义：rupper = /([A-Z]|^ms)/g
		if ( computedStyle ) {	//ownerDocument 可返回某元素的根元素，定义见：https://developer.mozilla.org/en-US/docs/DOM/Node.ownerDocument
																					//getComputedStyle，返回计算后的样式值，定义见：https://developer.mozilla.org/en-US/docs/DOM/window.getComputedStyle
																					//关于getComputedStyle与computed value、used value的关系：https://developer.mozilla.org/en-US/docs/CSS/computed_value
			ret = computedStyle.getPropertyValue( name );	// computedStyle.[ name ],name须为marginLeft 的形式，computedStyle.getPropertyValue( name )，name须为margin-left的形式
			if ( ret === "" && !util.contains( elem.ownerDocument.documentElement, elem ) ) {	//这句的作用？？
				ret = util.style( elem, name );
			}
			//document.documentElement返回文档的的根节点，比如html文档的<html>元素
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// WebKit uses "computed value (percentage if specified)" instead of "used value" for margins
		// which is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		//jQuery.support.pixelMargin：是否支持margin返回的结果是px为单位（webkit里面，如果设置了百分值，则返回百分值）？？
		//经chrome测试，util.support.pixelMargin === true
		if ( !util.support.pixelMargin && computedStyle && rmargin.test( name ) && rnumnonpx.test( ret ) ) {
			width = style.width;
			style.width = ret;
			ret = computedStyle.width;
			style.width = width;
		}

		return ret;
	};
}

//IE浏览器，此处留坑待填
if ( document.documentElement.currentStyle ) {	//currentStyle：IE浏览器特有的属性
	curCSS = function( elem, name ) {
		var left, rsLeft, uncomputed,
			ret = elem.currentStyle && elem.currentStyle[ name ],	//比如 var div = document.createElement('div'); div.currentStyle === null; 为true
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && (uncomputed = style[ name ]) ) {
			ret = uncomputed;
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		if ( rnumnonpx.test( ret ) ) {	//rnumnonpx定义：rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i

			// Remember the original values
			left = style.left;
			rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				elem.runtimeStyle.left = elem.currentStyle.left;	//@question 1：谁能告诉我这段神代码干什么的
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				elem.runtimeStyle.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};
}

//curCSS = getComputedStyle || currentStyle;

//@cssHooks2用到
//备注：神逻辑，求解释。。。
function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property
	var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		i = name === "width" ? 1 : 0,
		len = 4;

	if ( val > 0 ) {	//此处作用，减去paddingTopWidth、paddingBottomWidth、borderTopWidth、borderBottomWidth，要不要这么隐晦啊啊！！！
		if ( extra !== "border" ) {
			for ( ; i < len; i += 2 ) {
				if ( !extra ) {
					val -= parseFloat( util.css( elem, "padding" + cssExpand[ i ] ) ) || 0;
				}
				if ( extra === "margin" ) {
					val += parseFloat( util.css( elem, extra + cssExpand[ i ] ) ) || 0;
				} else {
					val -= parseFloat( util.css( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
				}
			}
		}

		return val + "px";
	}

	// Fall back to computed then uncomputed css if necessary
	val = curCSS( elem, name );
	if ( val < 0 || val == null ) {	//会有小于0的情况吗？？？
									//关于 val==null ：http://www.cnblogs.com/nuysoft/archive/2011/12/26/2297923.html
		val = elem.style[ name ];
	}

	// Computed unit is not pixels. Stop here and return.
	if ( rnumnonpx.test(val) ) {	//val单位非px
		return val;
	}

	// Normalize "", auto, and prepare for extra
	val = parseFloat( val ) || 0;

	// Add padding, border, margin
	//目测：在getClentHeight、getClientWidth等处可以用到
	if ( extra ) {
		for ( ; i < len; i += 2 ) {
			val += parseFloat( util.css( elem, "padding" + cssExpand[ i ] ) ) || 0;
			if ( extra !== "padding" ) {
				val += parseFloat( util.css( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
			}
			if ( extra === "margin" ) {
				val += parseFloat( util.css( elem, extra + cssExpand[ i ]) ) || 0;
			}
		}
	}

	return val + "px";
}

	//--------------------------------------------------------------------------------------------------------------------------------
	//从这里开始是对外的接口

	/**
	 * 获取文档树的根节点
	 * @ignore
	 */
	var rootDoc = 0;
	var getRootDoc = function(){
		return rootDoc ? rootDoc : rootDoc = util.support.boxModel ? document.documentElement : document.body;
	}
	var doc = document.documentElement;
	var body = document.body;
	
	$.CSS = {

		/**
		 * @description 获取文档树的根节点
		 * 
		 * @return 文档树的根节点
		 */
		getDocumentElement: getRootDoc,
		getComputedStyle: util.css,
		/**
		 * 获取节点的样式，IE9以下的IE浏览器获得的是该节点的原始样式，
		 * 其它浏览器将获取计算后的样式
		 * 
		 * @param {Object} node dom对象或dom的id
		 * @param {String} prop 属性名称
		 * @return prop属性对应的样式值
		 */
		getOriginalStyle: util.css,	//@疑问：IE9跟其他的浏览器还不一样？？？？？？？？？？？？？？？？？？？？？？


		/**
		 * @description设置节点的内联样式
		 * @param {Object | String} node dom对象或dom的id
		 * @param {String} props 如果props为对象，则该对象的所有属性将当成内联样式批量设置
		 * 		  		如果props为string，则当成内联样式的属性名称
		 * @param {String} value 内联样式的值，如果props为对象则该值将被忽略
		 */
		setStyle: function(node,props,value) {
			util.style( node, props, value );
		},

		getStyle: function( node, props ){
			return util.css( node, props );
		},

		/**
		 * @description 获取页面的垂直滚动距离
		 * 
		 * @return 当前页面的垂直滚动距离
		 */
		getPageScrollTop: function(){
			//https://developer.mozilla.org/en-US/docs/DOM/window.scrollY
			return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;		
		},
		/**
		 * @description 获取页面的水平滚动距离
		 * 
		 * @return 当前页面的水平滚动距离
		 */
		getPageScrollLeft: function(){
			//https://developer.mozilla.org/en-US/docs/DOM/window.scrollX
			var x = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
		},


		/**
		 * @description 获取当前鼠标的位置，一般用在鼠标事件的监听函数中调用
		 * 
		 * @param {Object} e 鼠标事件对象
		 * @return {
		 * 				left: 鼠标离页面左上角的水平距离,
		 * 				top:  鼠标离页面的左上角垂直距离
		 *         }
		 */	    
		getPointerPosition: function(e){
			e = e || window.event;
			return {
					left: e.pageX || (e.clientX + this.getPageScrollLeft()),
					top: e.pageY || (e.clientY + this.getPageScrollTop())
					};
		},
		/**
		 * @description 获取节点在页面中的位置
		 * 
		 * @param {object | String} node dom对象或dom的id
		 * @return {
		 * 			left: 节点离页面左上角的水平距离,
		 * 			top: 节点离页面的左上角垂直距离
		 * 			}
		 */
		getOffsetPosition: function(node){
			node = $(node);
			var top = 0, left = 0;
			if ( "getBoundingClientRect" in doc ){
				var box = node.getBoundingClientRect(); 
				var clientTop = doc.clientTop || body.clientTop || 0; 
				var clientLeft = doc.clientLeft || body.clientLeft || 0;
				top  = box.top  + this.getPageScrollTop() - clientTop,
				left = box.left + this.getPageScrollLeft() - clientLeft;
			}else{
				do{
					top += node.offsetTop || 0;
					left += node.offsetLeft || 0;
					node = node.offsetParent;
				} while (node);
			}
			return {left:left, top:top};    
		},
		/**
		 * @description 获取节点的宽度，包括内容宽度，填充宽度，边框的宽度
		 * 
		 * @param {Object | String} node dom对象或dom的id
		 * @return ｛Number｝ 节点的宽度
		 */
		getWidth: function( node ){
			return parseInt( util.css( node, 'width', 'border') );
		},
		/**
		 * @description 获取节点的宽度，包括内容高度，填充高度，边框的高度
		 * 
		 * @param {Object | String} node dom对象或dom的id
		 * @return {Number} 节点的高度
		 */
		getHeight: function( node ){
			return parseInt( util.css( node, 'height', 'border') );
		},
		/**
		 * @description 获取节点的宽度，包括内容宽度，填充宽度，但不包括边框的宽度
		 * 
		 * @param {object | String} node dom对象或dom的id
		 * @return  {Number} 节点的宽度
		 * @see getComputedStyle
		 */
		getClientWidth: function( node ){
			return util.css( node, 'width', 'padding' );
		},
		/**
		 * @description 获取节点的宽度，包括内容高度，填充高度，但不包括边框的高度
		 * 
		 * @param {object | String} node dom对象或dom的id
		 * @return  {Number} 节点的高度
		 * @see getComputedStyle
		 */
		getClientHeight: function( node ){
			return util.css( node, 'height', 'padding' );
		},


		/**
		 * @description 获取页面的宽度
		 * 
		 * @return 页面的宽度
		 */
		getPageWidth: function() {
			return Math.max(doc.clientWidth, body.clientWidth, doc.scrollWidth, body.scrollWidth);
		},
		/**
		 * @description 获取页面的高度
		 * 
		 * @return 页面的高度
		 */
		getPageHeight: function() {
			return Math.max(doc.clientHeight, body.clientHeight, doc.scrollHeight, body.scrollHeight);
		},


		/**
		 * getPageWidth()获取的是页面的滚动宽度，
		 * 下面方法获取的是页面不包含滚动条的宽度，即获取的是可视宽度
		 * @return {Number} body的宽度
		 */
		getBodyWidth: function() {
			return getRootDoc().clientWidth;
		},
		/**
		 * 同上
		 * @return {Number} body的高度
		 */
		getBodyHeight: function() {
			return getRootDoc().clientHeight;
		},

		/**
		 * @description 显示某个元素
		 *
		 * @param {Object} element dom元素
		 * @example
		 * 		$.css.show(dom);
		 */		
		show : function(element,display){
			var old;
			old = (old=element.getAttribute("_oldDisplay")) ? old : $.css.getComputedStyle(element,"display");
			display ? (element.style.display = display) : (old==="none") ? element.style.display="block" : element.style.display=old;
			//element.style.display = "";
			//if(element.tagName.toLowerCase() == "tr")element.style.display = "table-row";
		},
		/**
		 * @description 隐藏某个元素
		 *
		 * @param {Object} element dom元素
		 * @example
		 * 		$.css.hide(dom);
		 */
		hide : function(element){
			var old = $.css.getComputedStyle(element,"display");
			element.getAttribute("_oldDisplay") || (old === "none" ? element.setAttribute("_oldDisplay", "") : element.setAttribute("_oldDisplay", old));
			element.style.display="none";
		},
		/**
		 * @description 返回某个元素是否显示
		 *
		 * @param {Object} element dom元素
		 * @example
		 * 		$.css.isShow(dom);
		 */
		isShow : function(element){
			//return element.style.display === "none" ? false : true;
			return $.css.getComputedStyle(element,'display') === 'none' ? false : true;
		},

		/**
		 * @description 是否有样式名
		 *
		 * @param {Object} obj html对象
		 * @param {String} n 名称 
		 * @return {Boolean}
		 * @example
		 * 		$.css.addClass($('test'),'f-hover');
		 */
		hasClass:function(obj,n){
			if(!obj.className) return false;
			var name = obj.className.split(' ');
			for (var i=0,len=name.length;i<len;i++){
				if (n==name[i]) return true;	
			}
			return false;
		},
		/**
		 * 添加样式名
		 *
		 * @param {Object} obj html对象
		 * @param {String} n=名称 
		 * @example
		 * 		$.css.addClass($('test'),'f-hover');
		 */
		addClass:function(obj,n){
			 $.css.updateClass(obj,n,false);
		},
		/**
		 * 删除样式名
		 *
		 * @param {Object} obj html对象
		 * @param {String} n=名称 
		 * @example
		 * 		$.css.addClass($('test'),'f-hover');
		 */
		removeClass:function(obj,n){
			$.css.updateClass(obj,false,n);
		},
		/**
		 * 更新样式名
		 *
		 * @param {Object} obj html对象
		 * @param {String} addClass
		 * @param {String} removeClass, 
		 * @example
		 * 		$.css.addClass($('test'),'f-hover asdf','remove1 remove2');
		 */
		updateClass:function(obj,addClass,removeClass){
			var name = obj.className.split(' ');
			var objName = {}, i=0, len = name.length;
			for(;i<len;i++){
				name[i] && (objName[name[i]] = true);	
			}
			
			if (addClass){
				var addArr = addClass.split(' ');
				for(i=0,len=addArr.length;i<len;i++){
					addArr[i] && (objName[addArr[i]] = true);	
				}			
			}

			if (removeClass){
				var removeArr = removeClass.split(' ');
				for(i=0,len=removeArr.length;i<len;i++){
					removeArr[i] && (delete objName[removeArr[i]]);	
				}			
			}
			
			var res = [];
			for (var k in objName){
				res.push(k);
			}
			
			obj.className = res.join(' ');
		},
		/**
		 * 设置样式(直接覆写className)
		 *
		 * @param {Object} obj html对象
		 * @param {String} 要设置的样式 
		 * @example
		 * 		$.css.setClass($('test'),'f-hover asdf');
		 */
		setClass:function(obj,className){
			obj.className = className;
		}
	};


	function innerFunc(){
		window.jQuery = window.$$ = function(id){
			var elem = id.nodeType ? id : document.getElementById(id);
			return new jQuery.fn.init(elem);
		};


		jQuery.fn = jQuery.prototype;

		jQuery.fn = jQuery.prototype = {
			init: function( elem ){
				this[0] = elem;
				this.length = 1;
				return this;
			}
		};
		jQuery.fn.init.prototype = jQuery.fn;	
	}

})(window);
