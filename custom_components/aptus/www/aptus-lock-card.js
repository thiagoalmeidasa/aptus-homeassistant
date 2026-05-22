var t,e,i,s,n;let r;function o(t,e,i,s){var n,r=arguments.length,o=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var l=t.length-1;l>=0;l--)(n=t[l])&&(o=(r<3?n(o):r>3?n(e,i,o):n(e,i))||o);return r>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;let l=globalThis,a=l.ShadowRoot&&(void 0===l.ShadyCSS||l.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,h=Symbol(),d=new WeakMap;class c{get styleSheet(){let t=this.o,e=this.t;if(a&&void 0===t){let i=void 0!==e&&1===e.length;i&&(t=d.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&d.set(e,t))}return t}toString(){return this.cssText}constructor(t,e,i){if(this._$cssResult$=!0,i!==h)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}}let u=a?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e,i="";for(let e of t.cssRules)i+=e.cssText;return new c("string"==typeof(e=i)?e:e+"",void 0,h)})(t):t,{is:p,defineProperty:_,getOwnPropertyDescriptor:f,getOwnPropertyNames:g,getOwnPropertySymbols:v,getPrototypeOf:$}=Object,m=globalThis,y=m.trustedTypes,A=y?y.emptyScript:"",b=m.reactiveElementPolyfillSupport,w={toAttribute(t,e){switch(e){case Boolean:t=t?A:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},E=(t,e)=>!p(t,e),k={attribute:!0,type:String,converter:w,reflect:!1,useDefault:!1,hasChanged:E};null!=(t=Symbol).metadata||(t.metadata=Symbol("metadata")),null!=m.litPropertyMetadata||(m.litPropertyMetadata=new WeakMap);class x extends HTMLElement{static addInitializer(t){var e;this._$Ei(),(null!=(e=this.l)?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=k){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&_(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){var s;let{get:n,set:r}=null!=(s=f(this.prototype,t))?s:{get(){return this[e]},set(t){this[e]=t}};return{get:n,set(e){let s=null==n?void 0:n.call(this);null==r||r.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return null!=(e=this.elementProperties.get(t))?e:k}static _$Ei(){if(this.hasOwnProperty("elementProperties"))return;let t=$(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty("finalized"))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty("properties")){let t=this.properties;for(let e of[...g(t),...v(t)])this.createProperty(e,t[e])}let t=this[Symbol.metadata];if(null!==t){let e=litPropertyMetadata.get(t);if(void 0!==e)for(let[t,i]of e)this.elementProperties.set(t,i)}for(let[t,e]of(this._$Eh=new Map,this.elementProperties)){let i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t))for(let i of new Set(t.flat(1/0).reverse()))e.unshift(u(i));else void 0!==t&&e.push(u(t));return e}static _$Eu(t,e){let i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Ev(){var t;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),null==(t=this.constructor.l)||t.forEach(t=>t(this))}addController(t){var e,i;(null!=(i=this._$EO)?i:this._$EO=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&(null==(e=t.hostConnected)||e.call(t))}removeController(t){var e;null==(e=this._$EO)||e.delete(t)}_$E_(){let t=new Map;for(let e of this.constructor.elementProperties.keys())this.hasOwnProperty(e)&&(t.set(e,this[e]),delete this[e]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var t;let e=null!=(t=this.shadowRoot)?t:this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(a)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let i of e){let e=document.createElement("style"),s=l.litNonce;void 0!==s&&e.setAttribute("nonce",s),e.textContent=i.cssText,t.appendChild(e)}})(e,this.constructor.elementStyles),e}connectedCallback(){var t;null!=this.renderRoot||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null==(t=this._$EO)||t.forEach(t=>{var e;return null==(e=t.hostConnected)?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null==(t=this._$EO)||t.forEach(t=>{var e;return null==(e=t.hostDisconnected)?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){let i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){var n;let r=(void 0!==(null==(n=i.converter)?void 0:n.toAttribute)?i.converter:w).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){let i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){var n,r,o;let t=i.getPropertyOptions(s),l="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null==(n=t.converter)?void 0:n.fromAttribute)?t.converter:w;this._$Em=s;let a=l.fromAttribute(e,t.type);this[s]=null!=(o=null!=a?a:null==(r=this._$Ej)?void 0:r.get(s))?o:a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){var r,o;let l=this.constructor;if(!1===s&&(n=this[t]),null!=i||(i=l.getPropertyOptions(t)),!((null!=(o=i.hasChanged)?o:E)(n,e)||i.useDefault&&i.reflect&&n===(null==(r=this._$Ej)?void 0:r.get(t))&&!this.hasAttribute(l._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},r){var o,l,a;i&&!(null!=(o=this._$Ej)?o:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,null!=(l=null!=r?r:e)?l:this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(null!=(a=this._$Eq)?a:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(null!=this.renderRoot||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}let t=this.constructor.elementProperties;if(t.size>0)for(let[e,i]of t){let{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let e=!1,i=this._$AL;try{(e=this.shouldUpdate(i))?(this.willUpdate(i),null==(t=this._$EO)||t.forEach(t=>{var e;return null==(e=t.hostUpdate)?void 0:e.call(t)}),this.update(i)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null==(e=this._$EO)||e.forEach(t=>{var e;return null==(e=t.hostUpdated)?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(t){}firstUpdated(t){}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}}x.elementStyles=[],x.shadowRootOptions={mode:"open"},x.elementProperties=new Map,x.finalized=new Map,null==b||b({ReactiveElement:x}),(null!=(e=m.reactiveElementVersions)?e:m.reactiveElementVersions=[]).push("2.1.2");let S=globalThis,P=t=>t,C=S.trustedTypes,U=C?C.createPolicy("lit-html",{createHTML:t=>t}):void 0,M="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,O="?"+T,R=`<${O}>`,H=document,N=()=>H.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,j=Array.isArray,D="[ 	\n\f\r]",L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,I=/-->/g,W=/>/g,B=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),q=/'/g,V=/"/g,X=/^(?:script|style|textarea|title)$/i,J=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),K=J(1),Z=(J(2),J(3),Symbol.for("lit-noChange")),F=Symbol.for("lit-nothing"),G=new WeakMap,Q=H.createTreeWalker(H,129);function Y(t,e){if(!j(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==U?U.createHTML(e):e}class tt{static createElement(t,e){let i=H.createElement("template");return i.innerHTML=t,i}constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,r=0,o=t.length-1,l=this.parts,[a,h]=((t,e)=>{let i=t.length-1,s=[],n,r=2===e?"<svg>":3===e?"<math>":"",o=L;for(let e=0;e<i;e++){let i=t[e],l,a,h=-1,d=0;for(;d<i.length&&(o.lastIndex=d,null!==(a=o.exec(i)));)d=o.lastIndex,o===L?"!--"===a[1]?o=I:void 0!==a[1]?o=W:void 0!==a[2]?(X.test(a[2])&&(n=RegExp("</"+a[2],"g")),o=B):void 0!==a[3]&&(o=B):o===B?">"===a[0]?(o=null!=n?n:L,h=-1):void 0===a[1]?h=-2:(h=o.lastIndex-a[2].length,l=a[1],o=void 0===a[3]?B:'"'===a[3]?V:q):o===V||o===q?o=B:o===I||o===W?o=L:(o=B,n=void 0);let c=o===B&&t[e+1].startsWith("/>")?" ":"";r+=o===L?i+R:h>=0?(s.push(l),i.slice(0,h)+M+i.slice(h)+T+c):i+T+(-2===h?e:c)}return[Y(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]})(t,e);if(this.el=tt.createElement(a,i),Q.currentNode=this.el.content,2===e||3===e){let t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Q.nextNode())&&l.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(let t of s.getAttributeNames())if(t.endsWith(M)){let e=h[r++],i=s.getAttribute(t).split(T),o=/([.?@])?(.*)/.exec(e);l.push({type:1,index:n,name:o[2],strings:i,ctor:"."===o[1]?tr:"?"===o[1]?to:"@"===o[1]?tl:tn}),s.removeAttribute(t)}else t.startsWith(T)&&(l.push({type:6,index:n}),s.removeAttribute(t));if(X.test(s.tagName)){let t=s.textContent.split(T),e=t.length-1;if(e>0){s.textContent=C?C.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],N()),Q.nextNode(),l.push({type:2,index:++n});s.append(t[e],N())}}}else if(8===s.nodeType)if(s.data===O)l.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(T,t+1));)l.push({type:7,index:n}),t+=T.length-1}n++}}}function te(t,e,i=t,s){var n,r,o;if(e===Z)return e;let l=void 0!==s?null==(n=i._$Co)?void 0:n[s]:i._$Cl,a=z(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==a&&(null==l||null==(r=l._$AO)||r.call(l,!1),void 0===a?l=void 0:(l=new a(t))._$AT(t,i,s),void 0!==s?(null!=(o=i._$Co)?o:i._$Co=[])[s]=l:i._$Cl=l),void 0!==l&&(e=te(t,l._$AS(t,e.values),l,s)),e}class ti{get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:i},parts:s}=this._$AD,n=(null!=(e=null==t?void 0:t.creationScope)?e:H).importNode(i,!0);Q.currentNode=n;let r=Q.nextNode(),o=0,l=0,a=s[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new ts(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new ta(r,this,t)),this._$AV.push(e),a=s[++l]}o!==(null==a?void 0:a.index)&&(r=Q.nextNode(),o++)}return Q.currentNode=H,n}p(t){let e=0;for(let i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}}class ts{get _$AU(){var t,e;return null!=(e=null==(t=this._$AM)?void 0:t._$AU)?e:this._$Cv}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){let i;z(t=te(this,t,e))?t===F||null==t||""===t?(this._$AH!==F&&this._$AR(),this._$AH=F):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):j(i=t)||"function"==typeof(null==i?void 0:i[Symbol.iterator])?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==F&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(H.createTextNode(t)),this._$AH=t}$(t){var e;let{values:i,_$litType$:s}=t,n="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=tt.createElement(Y(s.h,s.h[0]),this.options)),s);if((null==(e=this._$AH)?void 0:e._$AD)===n)this._$AH.p(i);else{let t=new ti(n,this),e=t.u(this.options);t.p(i),this.T(e),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new tt(t)),e}k(t){j(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,s=0;for(let n of t)s===e.length?e.push(i=new ts(this.O(N()),this.O(N()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for(null==(i=this._$AP)||i.call(this,!1,!0,e);t!==this._$AB;){let e=P(t).nextSibling;P(t).remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cv=t,null==(e=this._$AP)||e.call(this,t))}constructor(t,e,i,s){var n;this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=null==(n=null==s?void 0:s.isConnected)||n}}class tn{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,s){let n=this.strings,r=!1;if(void 0===n)(r=!z(t=te(this,t,e,0))||t!==this._$AH&&t!==Z)&&(this._$AH=t);else{let s,o,l=t;for(t=n[0],s=0;s<n.length-1;s++)(o=te(this,l[i+s],e,s))===Z&&(o=this._$AH[s]),r||(r=!z(o)||o!==this._$AH[s]),o===F?t=F:t!==F&&(t+=(null!=o?o:"")+n[s+1]),this._$AH[s]=o}r&&!s&&this.j(t)}j(t){t===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}constructor(t,e,i,s,n){this.type=1,this._$AH=F,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}}class tr extends tn{j(t){this.element[this.name]=t===F?void 0:t}constructor(){super(...arguments),this.type=3}}class to extends tn{j(t){this.element.toggleAttribute(this.name,!!t&&t!==F)}constructor(){super(...arguments),this.type=4}}class tl extends tn{_$AI(t,e=this){var i;if((t=null!=(i=te(this,t,e,0))?i:F)===Z)return;let s=this._$AH,n=t===F&&s!==F||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==F&&(s===F||n);n&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!=(i=null==(e=this.options)?void 0:e.host)?i:this.element,t):this._$AH.handleEvent(t)}constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}}class ta{get _$AU(){return this._$AM._$AU}_$AI(t){te(this,t)}constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}}let th=S.litHtmlPolyfillSupport;null==th||th(tt,ts),(null!=(i=S.litHtmlVersions)?i:S.litHtmlVersions=[]).push("3.3.3");let td=globalThis;class tc extends x{createRenderRoot(){var t;let e=super.createRenderRoot();return null!=(t=this.renderOptions).renderBefore||(t.renderBefore=e.firstChild),e}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var s,n;let r=null!=(s=null==i?void 0:i.renderBefore)?s:e,o=r._$litPart$;if(void 0===o){let t=null!=(n=null==i?void 0:i.renderBefore)?n:null;r._$litPart$=o=new ts(e.insertBefore(N(),t),t,void 0,null!=i?i:{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null==(t=this._$Do)||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null==(t=this._$Do)||t.setConnected(!1)}render(){return Z}constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}}tc._$litElement$=!0,tc.finalized=!0,null==(s=td.litElementHydrateSupport)||s.call(td,{LitElement:tc});let tu=td.litElementPolyfillSupport;null==tu||tu({LitElement:tc}),(null!=(n=td.litElementVersions)?n:td.litElementVersions=[]).push("4.2.2");let tp={attribute:!0,type:String,converter:w,reflect:!1,hasChanged:E};function t_(t){return(e,i)=>{let s;return"object"==typeof i?((t=tp,e,i)=>{let{kind:s,metadata:n}=i,r=globalThis.litPropertyMetadata.get(n);if(void 0===r&&globalThis.litPropertyMetadata.set(n,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){let{name:s}=i;return{set(i){let n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){let{name:s}=i;return function(i){let n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)})(t,e,i):(s=e.hasOwnProperty(i),e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0)}}function tf(t){return t_({...t,state:!0,attribute:!1})}let tg=t=>t,tv,t$,tm,ty,tA,tb,tw,tE,tk;class tx extends tc{get _unlockDuration(){var t;return null!=(t=this._config.unlock_duration)?t:5}setConfig(t){if(!t.entities||0===t.entities.length)throw Error("Please define at least one entity");this._config=t}getCardSize(){var t,e,i,s;return(null!=(s=null==(e=this._config)||null==(t=e.entities)?void 0:t.length)?s:1)+ +(null!=(i=this._config)&&!!i.title)}disconnectedCallback(){for(let{timerId:t}of(super.disconnectedCallback(),this._unlockingEntities.values()))clearTimeout(t);this._unlockingEntities.clear()}willUpdate(t){if(super.willUpdate(t),t.has("hass")&&this._unlockingEntities.size>0){let t=!1;for(let[e,{timerId:i}]of this._unlockingEntities){let s=this.hass.states[e];(null==s?void 0:s.state)==="locked"&&(clearTimeout(i),this._unlockingEntities.delete(e),t=!0)}t&&(this._unlockingEntities=new Map(this._unlockingEntities))}}_onTouchStart(t,e){let i=t.currentTarget;this._startX=t.touches[0].clientX,this._trackWidth=i.offsetWidth,this._sliding=e,this._slideProgress=0}_onTouchMove(t){if(!this._sliding)return;let e=t.touches[0].clientX-this._startX;this._slideProgress=Math.max(0,Math.min(1,e/(this._trackWidth-48)))}_onTouchEnd(){this._sliding&&(this._slideProgress>.85?this._handleSlideComplete(this._sliding):(this._sliding=null,this._slideProgress=0))}_onMouseDown(t,e){let i=t.currentTarget;this._startX=t.clientX,this._trackWidth=i.offsetWidth,this._sliding=e,this._slideProgress=0;let s=t=>{let e=t.clientX-this._startX;this._slideProgress=Math.max(0,Math.min(1,e/(this._trackWidth-48)))},n=()=>{this._slideProgress>.85?this._handleSlideComplete(this._sliding):(this._sliding=null,this._slideProgress=0),window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",n)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",n)}_handleSlideComplete(t){this.hass.callService("lock","unlock",{},{entity_id:t}),this._completing=t,this._slideProgress=1,setTimeout(()=>{this._sliding=null,this._slideProgress=0,this._completing=null;let e=window.setTimeout(()=>{this._unlockingEntities.delete(t),this._unlockingEntities=new Map(this._unlockingEntities)},1e3*this._unlockDuration);this._unlockingEntities=new Map(this._unlockingEntities).set(t,{timerId:e})},300)}_renderRow(t){var e;let i=this.hass.states[t];if(!i)return K(tv||(tv=tg`
        <div class="lock-row unavailable">
          <ha-icon icon="mdi:lock-question"></ha-icon>
          <span class="lock-name">${0}</span>
          <span class="lock-state">Unavailable</span>
        </div>
      `),t);let s="locked"===i.state,n=this._unlockingEntities.has(t),r=this._completing===t,o=null!=(e=i.attributes.friendly_name)?e:t,l=!0===i.attributes.battery_low,a=this._sliding===t,h=a?100*this._slideProgress:0;return K(tb||(tb=tg`
      <div class="lock-row">
        <ha-icon icon=${0}></ha-icon>
        <span class="lock-name">${0}</span>
        ${0}
      </div>
      ${0}
    `),!s||n||r?"mdi:lock-open":"mdi:lock",o,l?K(t$||(t$=tg`<ha-icon class="battery-warning" icon="mdi:battery-alert-variant-outline"></ha-icon>`)):F,n?K(tm||(tm=tg`
            <div class="unlocked-countdown"
                 style="--countdown-duration: ${0}s">
              <div class="countdown-bar"></div>
              <span class="countdown-label">
                <ha-icon icon="mdi:lock-open-check"></ha-icon>
                Unlocked
              </span>
            </div>
          `),this._unlockDuration):s||r?K(ty||(ty=tg`
              <div
                class="slider-track ${0} ${0}"
                @touchstart=${0}
                @touchmove=${0}
                @touchend=${0}
                @mousedown=${0}
              >
                <div class="slider-fill" style="width: ${0}%"></div>
                <div class="slider-thumb" style="left: ${0}%">
                  <ha-icon icon="mdi:chevron-right"></ha-icon>
                </div>
                <span class="slider-label">Slide to unlock</span>
              </div>
            `),a?"sliding":"",r?"completing":"",e=>this._onTouchStart(e,t),this._onTouchMove,this._onTouchEnd,e=>this._onMouseDown(e,t),h,h):K(tA||(tA=tg`
              <div class="unlocked-state">
                <ha-icon icon="mdi:lock-open-check"></ha-icon>
                <span>Unlocked</span>
              </div>
            `)))}render(){return this._config&&this.hass?K(tE||(tE=tg`
      <ha-card>
        ${0}
        <div class="card-content">
          ${0}
        </div>
      </ha-card>
    `),this._config.title?K(tw||(tw=tg`<div class="card-header">${0}</div>`),this._config.title):F,this._config.entities.map(t=>this._renderRow(t))):F}constructor(...t){super(...t),this._sliding=null,this._slideProgress=0,this._completing=null,this._unlockingEntities=new Map,this._startX=0,this._trackWidth=0}}tx.styles=((t,...e)=>new c(1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]),t,h))(tk||(tk=tg`
    .card-header {
      padding: 16px 16px 0;
      font-size: 1.2em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .card-content {
      padding: 16px;
    }

    .lock-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .lock-row.unavailable {
      opacity: 0.5;
    }

    .lock-name {
      flex: 1;
      font-size: 1em;
      color: var(--primary-text-color);
    }

    .lock-state {
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }

    .battery-warning {
      color: var(--warning-color, #ff9800);
    }

    .slider-track {
      position: relative;
      height: 48px;
      border-radius: 24px;
      background: var(--primary-color, #03a9f4);
      overflow: hidden;
      cursor: grab;
      user-select: none;
      touch-action: none;
      margin: 4px 0 12px;
    }

    .slider-track.sliding {
      cursor: grabbing;
    }

    .slider-track.completing .slider-fill {
      transition: width 0.3s ease-out;
      width: 100% !important;
    }

    .slider-track.completing .slider-thumb {
      transition: left 0.3s ease-out;
      left: calc(100% - 44px) !important;
    }

    .slider-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      transition: none;
    }

    .slider-thumb {
      position: absolute;
      top: 4px;
      left: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: none;
    }

    .slider-thumb ha-icon {
      color: var(--primary-color, #03a9f4);
      --mdc-icon-size: 24px;
    }

    .slider-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
    }

    .unlocked-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      margin: 4px 0 12px;
      border-radius: 24px;
      background: var(--success-color, #4caf50);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }

    .unlocked-state ha-icon {
      color: #fff;
      --mdc-icon-size: 20px;
    }

    .unlocked-countdown {
      position: relative;
      height: 48px;
      border-radius: 24px;
      background: var(--success-color, #4caf50);
      overflow: hidden;
      margin: 4px 0 12px;
      animation: unlock-pulse 1.5s ease-in-out infinite;
    }

    .countdown-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      animation: countdown-shrink var(--countdown-duration, 5s) linear forwards;
    }

    .countdown-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .countdown-label ha-icon {
      color: #fff;
      --mdc-icon-size: 20px;
    }

    @keyframes countdown-shrink {
      from { width: 100%; }
      to   { width: 0%; }
    }

    @keyframes unlock-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
      50%      { box-shadow: 0 0 12px 4px rgba(76, 175, 80, 0.6); }
    }

    ha-icon {
      color: var(--state-icon-color, #44739e);
      --mdc-icon-size: 24px;
    }
  `)),o([t_({attribute:!1})],tx.prototype,"hass",void 0),o([tf()],tx.prototype,"_config",void 0),o([tf()],tx.prototype,"_sliding",void 0),o([tf()],tx.prototype,"_slideProgress",void 0),o([tf()],tx.prototype,"_completing",void 0),o([tf()],tx.prototype,"_unlockingEntities",void 0),tx=o([(r="aptus-lock-card",(t,e)=>{void 0!==e?e.addInitializer(()=>{customElements.define(r,t)}):customElements.define(r,t)})],tx),window.customCards=window.customCards||[],window.customCards.push({type:"aptus-lock-card",name:"Aptus Lock Card",description:"Card for controlling Aptus door locks with slide-to-unlock"});export{tx as AptusLockCard};