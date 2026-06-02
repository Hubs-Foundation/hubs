try{
(()=>{var u=__REACT__,{Children:ur,Component:dr,Fragment:cr,Profiler:fr,PureComponent:mr,StrictMode:br,Suspense:hr,__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED:gr,act:yr,cloneElement:vr,createContext:xr,createElement:Sr,createFactory:Cr,createRef:Tr,forwardRef:kr,isValidElement:wr,lazy:Pr,memo:Er,startTransition:_r,unstable_act:Br,useCallback:Rr,useContext:Ir,useDebugValue:Or,useDeferredValue:Fr,useEffect:G,useId:Dr,useImperativeHandle:Ar,useInsertionEffect:Hr,useLayoutEffect:jr,useMemo:zr,useReducer:Mr,useRef:Nr,useState:K,useSyncExternalStore:Lr,useTransition:$r,version:qr}=__REACT__;var Ur=__STORYBOOK_COMPONENTS__,{A:Zr,ActionBar:Jr,AddonPanel:U,Badge:Qr,Bar:Xr,Blockquote:Vr,Button:et,ClipboardCode:rt,Code:tt,DL:at,Div:ot,DocumentWrapper:nt,EmptyTabContent:st,ErrorFormatter:it,FlexBar:lt,Form:pt,H1:ut,H2:dt,H3:ct,H4:ft,H5:mt,H6:bt,HR:ht,IconButton:gt,Img:yt,LI:vt,Link:xt,ListItem:St,Loader:Ct,Modal:Tt,OL:kt,P:wt,Placeholder:Pt,Pre:Et,ProgressSpinner:_t,ResetWrapper:Bt,ScrollArea:Rt,Separator:It,Spaced:Ot,Span:Ft,StorybookIcon:Dt,StorybookLogo:At,SyntaxHighlighter:Z,TT:Ht,TabBar:jt,TabButton:zt,TabWrapper:Mt,Table:Nt,Tabs:Lt,TabsState:$t,TooltipLinkList:qt,TooltipMessage:Yt,TooltipNote:Wt,UL:Gt,WithTooltip:Kt,WithTooltipPure:Ut,Zoom:Zt,codeCommon:Jt,components:Qt,createCopyToClipboardFunction:Xt,getStoryHref:Vt,interleaveSeparators:ea,nameSpaceClassNames:ra,resetComponents:ta,withReset:J}=__STORYBOOK_COMPONENTS__;var ia=__STORYBOOK_API__,{ActiveTabs:la,Consumer:pa,ManagerContext:ua,Provider:da,RequestResponseError:ca,addons:F,combineParameters:fa,controlOrMetaKey:ma,controlOrMetaSymbol:ba,eventMatchesShortcut:ha,eventToShortcut:ga,experimental_MockUniversalStore:ya,experimental_UniversalStore:va,experimental_getStatusStore:xa,experimental_getTestProviderStore:Sa,experimental_requestResponse:Ca,experimental_useStatusStore:Ta,experimental_useTestProviderStore:ka,experimental_useUniversalStore:wa,internal_fullStatusStore:Pa,internal_fullTestProviderStore:Ea,internal_universalStatusStore:_a,internal_universalTestProviderStore:Ba,isMacLike:Ra,isShortcutTaken:Ia,keyToSymbol:Oa,merge:Fa,mockChannel:Da,optionOrAltSymbol:Aa,shortcutMatchesShortcut:Ha,shortcutToHumanString:ja,types:Q,useAddonState:za,useArgTypes:Ma,useArgs:Na,useChannel:X,useGlobalTypes:La,useGlobals:$a,useParameter:V,useSharedState:qa,useStoryPrepared:Ya,useStorybookApi:Wa,useStorybookState:Ga}=__STORYBOOK_API__;var Qa=__STORYBOOK_THEMING__,{CacheProvider:Xa,ClassNames:Va,Global:eo,ThemeProvider:ee,background:ro,color:to,convert:re,create:ao,createCache:oo,createGlobal:no,createReset:so,css:io,darken:lo,ensure:po,ignoreSsrWarning:D,isPropValid:uo,jsx:co,keyframes:fo,lighten:mo,styled:x,themes:A,typography:bo,useTheme:H,withTheme:ho}=__STORYBOOK_THEMING__;var Y="storybook/docs",ue=`${Y}/panel`,te="docs",ae=`${Y}/snippet-rendered`;function d(){return d=Object.assign?Object.assign.bind():function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var a in t)({}).hasOwnProperty.call(t,a)&&(e[a]=t[a])}return e},d.apply(null,arguments)}function de(e){if(e===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function E(e,r){return E=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,a){return t.__proto__=a,t},E(e,r)}function ce(e,r){e.prototype=Object.create(r.prototype),e.prototype.constructor=e,E(e,r)}function N(e){return N=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(r){return r.__proto__||Object.getPrototypeOf(r)},N(e)}function fe(e){try{return Function.toString.call(e).indexOf("[native code]")!==-1}catch{return typeof e=="function"}}function ne(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch{}return(ne=function(){return!!e})()}function me(e,r,t){if(ne())return Reflect.construct.apply(null,arguments);var a=[null];a.push.apply(a,r);var o=new(e.bind.apply(e,a));return t&&E(o,t.prototype),o}function L(e){var r=typeof Map=="function"?new Map:void 0;return L=function(t){if(t===null||!fe(t))return t;if(typeof t!="function")throw new TypeError("Super expression must either be null or a function");if(r!==void 0){if(r.has(t))return r.get(t);r.set(t,a)}function a(){return me(t,arguments,N(this).constructor)}return a.prototype=Object.create(t.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),E(a,t)},L(e)}var be={1:`Passed invalid arguments to hsl, please pass multiple numbers e.g. hsl(360, 0.75, 0.4) or an object e.g. rgb({ hue: 255, saturation: 0.4, lightness: 0.75 }).

`,2:`Passed invalid arguments to hsla, please pass multiple numbers e.g. hsla(360, 0.75, 0.4, 0.7) or an object e.g. rgb({ hue: 255, saturation: 0.4, lightness: 0.75, alpha: 0.7 }).

`,3:`Passed an incorrect argument to a color function, please pass a string representation of a color.

`,4:`Couldn't generate valid rgb string from %s, it returned %s.

`,5:`Couldn't parse the color string. Please provide the color as a string in hex, rgb, rgba, hsl or hsla notation.

`,6:`Passed invalid arguments to rgb, please pass multiple numbers e.g. rgb(255, 205, 100) or an object e.g. rgb({ red: 255, green: 205, blue: 100 }).

`,7:`Passed invalid arguments to rgba, please pass multiple numbers e.g. rgb(255, 205, 100, 0.75) or an object e.g. rgb({ red: 255, green: 205, blue: 100, alpha: 0.75 }).

`,8:`Passed invalid argument to toColorString, please pass a RgbColor, RgbaColor, HslColor or HslaColor object.

`,9:`Please provide a number of steps to the modularScale helper.

`,10:`Please pass a number or one of the predefined scales to the modularScale helper as the ratio.

`,11:`Invalid value passed as base to modularScale, expected number or em string but got "%s"

`,12:`Expected a string ending in "px" or a number passed as the first argument to %s(), got "%s" instead.

`,13:`Expected a string ending in "px" or a number passed as the second argument to %s(), got "%s" instead.

`,14:`Passed invalid pixel value ("%s") to %s(), please pass a value like "12px" or 12.

`,15:`Passed invalid base value ("%s") to %s(), please pass a value like "12px" or 12.

`,16:`You must provide a template to this method.

`,17:`You passed an unsupported selector state to this method.

`,18:`minScreen and maxScreen must be provided as stringified numbers with the same units.

`,19:`fromSize and toSize must be provided as stringified numbers with the same units.

`,20:`expects either an array of objects or a single object with the properties prop, fromSize, and toSize.

`,21:"expects the objects in the first argument array to have the properties `prop`, `fromSize`, and `toSize`.\n\n",22:"expects the first argument object to have the properties `prop`, `fromSize`, and `toSize`.\n\n",23:`fontFace expects a name of a font-family.

`,24:`fontFace expects either the path to the font file(s) or a name of a local copy.

`,25:`fontFace expects localFonts to be an array.

`,26:`fontFace expects fileFormats to be an array.

`,27:`radialGradient requries at least 2 color-stops to properly render.

`,28:`Please supply a filename to retinaImage() as the first argument.

`,29:`Passed invalid argument to triangle, please pass correct pointingDirection e.g. 'right'.

`,30:"Passed an invalid value to `height` or `width`. Please provide a pixel based unit.\n\n",31:`The animation shorthand only takes 8 arguments. See the specification for more information: http://mdn.io/animation

`,32:`To pass multiple animations please supply them in arrays, e.g. animation(['rotate', '2s'], ['move', '1s'])
To pass a single animation please supply them in simple values, e.g. animation('rotate', '2s')

`,33:`The animation shorthand arrays can only have 8 elements. See the specification for more information: http://mdn.io/animation

`,34:`borderRadius expects a radius value as a string or number as the second argument.

`,35:`borderRadius expects one of "top", "bottom", "left" or "right" as the first argument.

`,36:`Property must be a string value.

`,37:`Syntax Error at %s.

`,38:`Formula contains a function that needs parentheses at %s.

`,39:`Formula is missing closing parenthesis at %s.

`,40:`Formula has too many closing parentheses at %s.

`,41:`All values in a formula must have the same unit or be unitless.

`,42:`Please provide a number of steps to the modularScale helper.

`,43:`Please pass a number or one of the predefined scales to the modularScale helper as the ratio.

`,44:`Invalid value passed as base to modularScale, expected number or em/rem string but got %s.

`,45:`Passed invalid argument to hslToColorString, please pass a HslColor or HslaColor object.

`,46:`Passed invalid argument to rgbToColorString, please pass a RgbColor or RgbaColor object.

`,47:`minScreen and maxScreen must be provided as stringified numbers with the same units.

`,48:`fromSize and toSize must be provided as stringified numbers with the same units.

`,49:`Expects either an array of objects or a single object with the properties prop, fromSize, and toSize.

`,50:`Expects the objects in the first argument array to have the properties prop, fromSize, and toSize.

`,51:`Expects the first argument object to have the properties prop, fromSize, and toSize.

`,52:`fontFace expects either the path to the font file(s) or a name of a local copy.

`,53:`fontFace expects localFonts to be an array.

`,54:`fontFace expects fileFormats to be an array.

`,55:`fontFace expects a name of a font-family.

`,56:`linearGradient requries at least 2 color-stops to properly render.

`,57:`radialGradient requries at least 2 color-stops to properly render.

`,58:`Please supply a filename to retinaImage() as the first argument.

`,59:`Passed invalid argument to triangle, please pass correct pointingDirection e.g. 'right'.

`,60:"Passed an invalid value to `height` or `width`. Please provide a pixel based unit.\n\n",61:`Property must be a string value.

`,62:`borderRadius expects a radius value as a string or number as the second argument.

`,63:`borderRadius expects one of "top", "bottom", "left" or "right" as the first argument.

`,64:`The animation shorthand only takes 8 arguments. See the specification for more information: http://mdn.io/animation.

`,65:`To pass multiple animations please supply them in arrays, e.g. animation(['rotate', '2s'], ['move', '1s'])\\nTo pass a single animation please supply them in simple values, e.g. animation('rotate', '2s').

`,66:`The animation shorthand arrays can only have 8 elements. See the specification for more information: http://mdn.io/animation.

`,67:`You must provide a template to this method.

`,68:`You passed an unsupported selector state to this method.

`,69:`Expected a string ending in "px" or a number passed as the first argument to %s(), got %s instead.

`,70:`Expected a string ending in "px" or a number passed as the second argument to %s(), got %s instead.

`,71:`Passed invalid pixel value %s to %s(), please pass a value like "12px" or 12.

`,72:`Passed invalid base value %s to %s(), please pass a value like "12px" or 12.

`,73:`Please provide a valid CSS variable.

`,74:`CSS variable not found and no default was provided.

`,75:`important requires a valid style object, got a %s instead.

`,76:`fromSize and toSize must be provided as stringified numbers with the same units as minScreen and maxScreen.

`,77:`remToPx expects a value in "rem" but you provided it in "%s".

`,78:`base must be set in "px" or "%" but you set it in "%s".
`};function he(){for(var e=arguments.length,r=new Array(e),t=0;t<e;t++)r[t]=arguments[t];var a=r[0],o=[],n;for(n=1;n<r.length;n+=1)o.push(r[n]);return o.forEach(function(s){a=a.replace(/%[a-z]/,s)}),a}var h=(function(e){ce(r,e);function r(t){for(var a,o=arguments.length,n=new Array(o>1?o-1:0),s=1;s<o;s++)n[s-1]=arguments[s];return a=e.call(this,he.apply(void 0,[be[t]].concat(n)))||this,de(a)}return r})(L(Error));function j(e){return Math.round(e*255)}function ge(e,r,t){return j(e)+","+j(r)+","+j(t)}function _(e,r,t,a){if(a===void 0&&(a=ge),r===0)return a(t,t,t);var o=(e%360+360)%360/60,n=(1-Math.abs(2*t-1))*r,s=n*(1-Math.abs(o%2-1)),i=0,l=0,p=0;o>=0&&o<1?(i=n,l=s):o>=1&&o<2?(i=s,l=n):o>=2&&o<3?(l=n,p=s):o>=3&&o<4?(l=s,p=n):o>=4&&o<5?(i=s,p=n):o>=5&&o<6&&(i=n,p=s);var b=t-n/2,m=i+b,c=l+b,T=p+b;return a(m,c,T)}var oe={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"639",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"};function ye(e){if(typeof e!="string")return e;var r=e.toLowerCase();return oe[r]?"#"+oe[r]:e}var ve=/^#[a-fA-F0-9]{6}$/,xe=/^#[a-fA-F0-9]{8}$/,Se=/^#[a-fA-F0-9]{3}$/,Ce=/^#[a-fA-F0-9]{4}$/,z=/^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i,Te=/^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i,ke=/^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i,we=/^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;function S(e){if(typeof e!="string")throw new h(3);var r=ye(e);if(r.match(ve))return{red:parseInt(""+r[1]+r[2],16),green:parseInt(""+r[3]+r[4],16),blue:parseInt(""+r[5]+r[6],16)};if(r.match(xe)){var t=parseFloat((parseInt(""+r[7]+r[8],16)/255).toFixed(2));return{red:parseInt(""+r[1]+r[2],16),green:parseInt(""+r[3]+r[4],16),blue:parseInt(""+r[5]+r[6],16),alpha:t}}if(r.match(Se))return{red:parseInt(""+r[1]+r[1],16),green:parseInt(""+r[2]+r[2],16),blue:parseInt(""+r[3]+r[3],16)};if(r.match(Ce)){var a=parseFloat((parseInt(""+r[4]+r[4],16)/255).toFixed(2));return{red:parseInt(""+r[1]+r[1],16),green:parseInt(""+r[2]+r[2],16),blue:parseInt(""+r[3]+r[3],16),alpha:a}}var o=z.exec(r);if(o)return{red:parseInt(""+o[1],10),green:parseInt(""+o[2],10),blue:parseInt(""+o[3],10)};var n=Te.exec(r.substring(0,50));if(n)return{red:parseInt(""+n[1],10),green:parseInt(""+n[2],10),blue:parseInt(""+n[3],10),alpha:parseFloat(""+n[4])>1?parseFloat(""+n[4])/100:parseFloat(""+n[4])};var s=ke.exec(r);if(s){var i=parseInt(""+s[1],10),l=parseInt(""+s[2],10)/100,p=parseInt(""+s[3],10)/100,b="rgb("+_(i,l,p)+")",m=z.exec(b);if(!m)throw new h(4,r,b);return{red:parseInt(""+m[1],10),green:parseInt(""+m[2],10),blue:parseInt(""+m[3],10)}}var c=we.exec(r.substring(0,50));if(c){var T=parseInt(""+c[1],10),le=parseInt(""+c[2],10)/100,pe=parseInt(""+c[3],10)/100,W="rgb("+_(T,le,pe)+")",B=z.exec(W);if(!B)throw new h(4,r,W);return{red:parseInt(""+B[1],10),green:parseInt(""+B[2],10),blue:parseInt(""+B[3],10),alpha:parseFloat(""+c[4])>1?parseFloat(""+c[4])/100:parseFloat(""+c[4])}}throw new h(5)}function Pe(e){var r=e.red/255,t=e.green/255,a=e.blue/255,o=Math.max(r,t,a),n=Math.min(r,t,a),s=(o+n)/2;if(o===n)return e.alpha!==void 0?{hue:0,saturation:0,lightness:s,alpha:e.alpha}:{hue:0,saturation:0,lightness:s};var i,l=o-n,p=s>.5?l/(2-o-n):l/(o+n);switch(o){case r:i=(t-a)/l+(t<a?6:0);break;case t:i=(a-r)/l+2;break;default:i=(r-t)/l+4;break}return i*=60,e.alpha!==void 0?{hue:i,saturation:p,lightness:s,alpha:e.alpha}:{hue:i,saturation:p,lightness:s}}function g(e){return Pe(S(e))}var Ee=function(e){return e.length===7&&e[1]===e[2]&&e[3]===e[4]&&e[5]===e[6]?"#"+e[1]+e[3]+e[5]:e},$=Ee;function v(e){var r=e.toString(16);return r.length===1?"0"+r:r}function M(e){return v(Math.round(e*255))}function _e(e,r,t){return $("#"+M(e)+M(r)+M(t))}function I(e,r,t){return _(e,r,t,_e)}function Be(e,r,t){if(typeof e=="number"&&typeof r=="number"&&typeof t=="number")return I(e,r,t);if(typeof e=="object"&&r===void 0&&t===void 0)return I(e.hue,e.saturation,e.lightness);throw new h(1)}function Re(e,r,t,a){if(typeof e=="number"&&typeof r=="number"&&typeof t=="number"&&typeof a=="number")return a>=1?I(e,r,t):"rgba("+_(e,r,t)+","+a+")";if(typeof e=="object"&&r===void 0&&t===void 0&&a===void 0)return e.alpha>=1?I(e.hue,e.saturation,e.lightness):"rgba("+_(e.hue,e.saturation,e.lightness)+","+e.alpha+")";throw new h(2)}function q(e,r,t){if(typeof e=="number"&&typeof r=="number"&&typeof t=="number")return $("#"+v(e)+v(r)+v(t));if(typeof e=="object"&&r===void 0&&t===void 0)return $("#"+v(e.red)+v(e.green)+v(e.blue));throw new h(6)}function O(e,r,t,a){if(typeof e=="string"&&typeof r=="number"){var o=S(e);return"rgba("+o.red+","+o.green+","+o.blue+","+r+")"}else{if(typeof e=="number"&&typeof r=="number"&&typeof t=="number"&&typeof a=="number")return a>=1?q(e,r,t):"rgba("+e+","+r+","+t+","+a+")";if(typeof e=="object"&&r===void 0&&t===void 0&&a===void 0)return e.alpha>=1?q(e.red,e.green,e.blue):"rgba("+e.red+","+e.green+","+e.blue+","+e.alpha+")"}throw new h(7)}var Ie=function(e){return typeof e.red=="number"&&typeof e.green=="number"&&typeof e.blue=="number"&&(typeof e.alpha!="number"||typeof e.alpha>"u")},Oe=function(e){return typeof e.red=="number"&&typeof e.green=="number"&&typeof e.blue=="number"&&typeof e.alpha=="number"},Fe=function(e){return typeof e.hue=="number"&&typeof e.saturation=="number"&&typeof e.lightness=="number"&&(typeof e.alpha!="number"||typeof e.alpha>"u")},De=function(e){return typeof e.hue=="number"&&typeof e.saturation=="number"&&typeof e.lightness=="number"&&typeof e.alpha=="number"};function y(e){if(typeof e!="object")throw new h(8);if(Oe(e))return O(e);if(Ie(e))return q(e);if(De(e))return Re(e);if(Fe(e))return Be(e);throw new h(8)}function se(e,r,t){return function(){var a=t.concat(Array.prototype.slice.call(arguments));return a.length>=r?e.apply(this,a):se(e,r,a)}}function f(e){return se(e,e.length,[])}function Ae(e,r){if(r==="transparent")return r;var t=g(r);return y(d({},t,{hue:t.hue+parseFloat(e)}))}f(Ae);function C(e,r,t){return Math.max(e,Math.min(r,t))}function He(e,r){if(r==="transparent")return r;var t=g(r);return y(d({},t,{lightness:C(0,1,t.lightness-parseFloat(e))}))}f(He);function je(e,r){if(r==="transparent")return r;var t=g(r);return y(d({},t,{saturation:C(0,1,t.saturation-parseFloat(e))}))}f(je);function ze(e,r){if(r==="transparent")return r;var t=g(r);return y(d({},t,{lightness:C(0,1,t.lightness+parseFloat(e))}))}f(ze);function Me(e,r,t){if(r==="transparent")return t;if(t==="transparent")return r;if(e===0)return t;var a=S(r),o=d({},a,{alpha:typeof a.alpha=="number"?a.alpha:1}),n=S(t),s=d({},n,{alpha:typeof n.alpha=="number"?n.alpha:1}),i=o.alpha-s.alpha,l=parseFloat(e)*2-1,p=l*i===-1?l:l+i,b=1+l*i,m=(p/b+1)/2,c=1-m,T={red:Math.floor(o.red*m+s.red*c),green:Math.floor(o.green*m+s.green*c),blue:Math.floor(o.blue*m+s.blue*c),alpha:o.alpha*parseFloat(e)+s.alpha*(1-parseFloat(e))};return O(T)}var Ne=f(Me),ie=Ne;function Le(e,r){if(r==="transparent")return r;var t=S(r),a=typeof t.alpha=="number"?t.alpha:1,o=d({},t,{alpha:C(0,1,(a*100+parseFloat(e)*100)/100)});return O(o)}f(Le);function $e(e,r){if(r==="transparent")return r;var t=g(r);return y(d({},t,{saturation:C(0,1,t.saturation+parseFloat(e))}))}f($e);function qe(e,r){return r==="transparent"?r:y(d({},g(r),{hue:parseFloat(e)}))}f(qe);function Ye(e,r){return r==="transparent"?r:y(d({},g(r),{lightness:parseFloat(e)}))}f(Ye);function We(e,r){return r==="transparent"?r:y(d({},g(r),{saturation:parseFloat(e)}))}f(We);function Ge(e,r){return r==="transparent"?r:ie(parseFloat(e),"rgb(0, 0, 0)",r)}f(Ge);function Ke(e,r){return r==="transparent"?r:ie(parseFloat(e),"rgb(255, 255, 255)",r)}f(Ke);function Ue(e,r){if(r==="transparent")return r;var t=S(r),a=typeof t.alpha=="number"?t.alpha:1,o=d({},t,{alpha:C(0,1,+(a*100-parseFloat(e)*100).toFixed(2)/100)});return O(o)}var Ze=f(Ue),Je=Ze,Qe=x.div(J,({theme:e})=>({backgroundColor:e.base==="light"?"rgba(0,0,0,.01)":"rgba(255,255,255,.01)",borderRadius:e.appBorderRadius,border:`1px dashed ${e.appBorderColor}`,display:"flex",alignItems:"center",justifyContent:"center",padding:20,margin:"25px 0 40px",color:Je(.3,e.color.defaultText),fontSize:e.typography.size.s2})),Xe=e=>u.createElement(Qe,{...e,className:"docblock-emptyblock sb-unstyled"}),Ve=x(Z)(({theme:e})=>({fontSize:`${e.typography.size.s2-1}px`,lineHeight:"19px",margin:"25px 0 40px",borderRadius:e.appBorderRadius,boxShadow:e.base==="light"?"rgba(0, 0, 0, 0.10) 0 1px 3px 0":"rgba(0, 0, 0, 0.20) 0 2px 5px 0","pre.prismjs":{padding:20,background:"inherit"}})),er=x.div(({theme:e})=>({background:e.background.content,borderRadius:e.appBorderRadius,border:`1px solid ${e.appBorderColor}`,boxShadow:e.base==="light"?"rgba(0, 0, 0, 0.10) 0 1px 3px 0":"rgba(0, 0, 0, 0.20) 0 2px 5px 0",margin:"25px 0 40px",padding:"20px 20px 20px 22px"})),R=x.div(({theme:e})=>({animation:`${e.animation.glow} 1.5s ease-in-out infinite`,background:e.appBorderColor,height:17,marginTop:1,width:"60%",[`&:first-child${D}`]:{margin:0}})),rr=()=>u.createElement(er,null,u.createElement(R,null),u.createElement(R,{style:{width:"80%"}}),u.createElement(R,{style:{width:"30%"}}),u.createElement(R,{style:{width:"80%"}})),tr=({isLoading:e,error:r,language:t,code:a,dark:o,format:n=!0,...s})=>{let{typography:i}=H();if(e)return u.createElement(rr,null);if(r)return u.createElement(Xe,null,r);let l=u.createElement(Ve,{bordered:!0,copyable:!0,format:n,language:t??"jsx",className:"docblock-source sb-unstyled",...s},a);if(typeof o>"u")return l;let p=o?A.dark:A.light;return u.createElement(ee,{theme:re({...p,fontCode:i.fonts.mono,fontBase:i.fonts.base})},l)};F.register(Y,e=>{F.add(ue,{title:"Code",type:Q.PANEL,paramKey:te,disabled:r=>!r?.docs?.codePanel,match:({viewMode:r})=>r==="story",render:({active:r})=>{let t=e.getChannel(),a=e.getCurrentStoryData(),o=t?.last(ae)?.[0],[n,s]=K({source:o?.source,format:o?.format??void 0}),i=V(te,{source:{code:""},theme:"dark"});G(()=>{s({source:void 0,format:void 0})},[a?.id]),X({[ae]:({source:p,format:b})=>{s({source:p,format:b})}});let l=H().base!=="light";return u.createElement(U,{active:!!r},u.createElement(ar,null,u.createElement(tr,{...i.source,code:i.source?.code||n.source||i.source?.originalSource,format:n.format,dark:l})))}})});var ar=x.div(()=>({height:"100%",[`> :first-child${D}`]:{margin:0,height:"100%",boxShadow:"none"}}));})();
}catch(e){ console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e); }
