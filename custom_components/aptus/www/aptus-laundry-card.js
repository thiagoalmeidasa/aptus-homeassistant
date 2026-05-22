var t,e,s,i,r;let n;function o(t,e,s,i){var r,n=arguments.length,o=n<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,s,o):r(e,s))||o);return n>3&&o&&Object.defineProperty(e,s,o),o}"function"==typeof SuppressedError&&SuppressedError;let a=globalThis,l=a.ShadowRoot&&(void 0===a.ShadyCSS||a.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,d=Symbol(),c=new WeakMap;class h{get styleSheet(){let t=this.o,e=this.t;if(l&&void 0===t){let s=void 0!==e&&1===e.length;s&&(t=c.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&c.set(e,t))}return t}toString(){return this.cssText}constructor(t,e,s){if(this._$cssResult$=!0,s!==d)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}}let p=(t,...e)=>new h(1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]),t,d),u=l?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e,s="";for(let e of t.cssRules)s+=e.cssText;return new h("string"==typeof(e=s)?e:e+"",void 0,d)})(t):t,{is:_,defineProperty:v,getOwnPropertyDescriptor:g,getOwnPropertyNames:y,getOwnPropertySymbols:f,getPrototypeOf:b}=Object,$=globalThis,m=$.trustedTypes,x=m?m.emptyScript:"",A=$.reactiveElementPolyfillSupport,w={toAttribute(t,e){switch(e){case Boolean:t=t?x:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},E=(t,e)=>!_(t,e),k={attribute:!0,type:String,converter:w,reflect:!1,useDefault:!1,hasChanged:E};null!=(t=Symbol).metadata||(t.metadata=Symbol("metadata")),null!=$.litPropertyMetadata||($.litPropertyMetadata=new WeakMap);class S extends HTMLElement{static addInitializer(t){var e;this._$Ei(),(null!=(e=this.l)?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=k){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&v(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){var i;let{get:r,set:n}=null!=(i=g(this.prototype,t))?i:{get(){return this[e]},set(t){this[e]=t}};return{get:r,set(e){let i=null==r?void 0:r.call(this);null==n||n.call(this,e),this.requestUpdate(t,i,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return null!=(e=this.elementProperties.get(t))?e:k}static _$Ei(){if(this.hasOwnProperty("elementProperties"))return;let t=b(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty("finalized"))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty("properties")){let t=this.properties;for(let e of[...y(t),...f(t)])this.createProperty(e,t[e])}let t=this[Symbol.metadata];if(null!==t){let e=litPropertyMetadata.get(t);if(void 0!==e)for(let[t,s]of e)this.elementProperties.set(t,s)}for(let[t,e]of(this._$Eh=new Map,this.elementProperties)){let s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t))for(let s of new Set(t.flat(1/0).reverse()))e.unshift(u(s));else void 0!==t&&e.push(u(t));return e}static _$Eu(t,e){let s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}_$Ev(){var t;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),null==(t=this.constructor.l)||t.forEach(t=>t(this))}addController(t){var e,s;(null!=(s=this._$EO)?s:this._$EO=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&(null==(e=t.hostConnected)||e.call(t))}removeController(t){var e;null==(e=this._$EO)||e.delete(t)}_$E_(){let t=new Map;for(let e of this.constructor.elementProperties.keys())this.hasOwnProperty(e)&&(t.set(e,this[e]),delete this[e]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var t;let e=null!=(t=this.shadowRoot)?t:this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(l)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let s of e){let e=document.createElement("style"),i=a.litNonce;void 0!==i&&e.setAttribute("nonce",i),e.textContent=s.cssText,t.appendChild(e)}})(e,this.constructor.elementStyles),e}connectedCallback(){var t;null!=this.renderRoot||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null==(t=this._$EO)||t.forEach(t=>{var e;return null==(e=t.hostConnected)?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null==(t=this._$EO)||t.forEach(t=>{var e;return null==(e=t.hostDisconnected)?void 0:e.call(t)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){var r;let n=(void 0!==(null==(r=s.converter)?void 0:r.toAttribute)?s.converter:w).toAttribute(e,s.type);this._$Em=t,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){let s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){var r,n,o;let t=s.getPropertyOptions(i),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null==(r=t.converter)?void 0:r.fromAttribute)?t.converter:w;this._$Em=i;let l=a.fromAttribute(e,t.type);this[i]=null!=(o=null!=l?l:null==(n=this._$Ej)?void 0:n.get(i))?o:l,this._$Em=null}}requestUpdate(t,e,s,i=!1,r){if(void 0!==t){var n,o;let a=this.constructor;if(!1===i&&(r=this[t]),null!=s||(s=a.getPropertyOptions(t)),!((null!=(o=s.hasChanged)?o:E)(r,e)||s.useDefault&&s.reflect&&r===(null==(n=this._$Ej)?void 0:n.get(t))&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:r},n){var o,a,l;s&&!(null!=(o=this._$Ej)?o:this._$Ej=new Map).has(t)&&(this._$Ej.set(t,null!=(a=null!=n?n:e)?a:this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(null!=(l=this._$Eq)?l:this._$Eq=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(null!=this.renderRoot||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}let t=this.constructor.elementProperties;if(t.size>0)for(let[e,s]of t){let{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let e=!1,s=this._$AL;try{(e=this.shouldUpdate(s))?(this.willUpdate(s),null==(t=this._$EO)||t.forEach(t=>{var e;return null==(e=t.hostUpdate)?void 0:e.call(t)}),this.update(s)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;null==(e=this._$EO)||e.forEach(t=>{var e;return null==(e=t.hostUpdated)?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(t){}firstUpdated(t){}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}}S.elementStyles=[],S.shadowRootOptions={mode:"open"},S.elementProperties=new Map,S.finalized=new Map,null==A||A({ReactiveElement:S}),(null!=(e=$.reactiveElementVersions)?e:$.reactiveElementVersions=[]).push("2.1.2");let C=globalThis,P=t=>t,M=C.trustedTypes,U=M?M.createPolicy("lit-html",{createHTML:t=>t}):void 0,O="$lit$",I=`lit$${Math.random().toFixed(9).slice(2)}$`,z="?"+I,L=`<${z}>`,R=document,N=()=>R.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,D="[ 	\n\f\r]",j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,B=/-->/g,q=/>/g,G=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),W=/'/g,V=/"/g,K=/^(?:script|style|textarea|title)$/i,F=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),J=F(1),Z=(F(2),F(3),Symbol.for("lit-noChange")),Y=Symbol.for("lit-nothing"),Q=new WeakMap,X=R.createTreeWalker(R,129);function tt(t,e){if(!H(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==U?U.createHTML(e):e}class te{static createElement(t,e){let s=R.createElement("template");return s.innerHTML=t,s}constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,n=0,o=t.length-1,a=this.parts,[l,d]=((t,e)=>{let s=t.length-1,i=[],r,n=2===e?"<svg>":3===e?"<math>":"",o=j;for(let e=0;e<s;e++){let s=t[e],a,l,d=-1,c=0;for(;c<s.length&&(o.lastIndex=c,null!==(l=o.exec(s)));)c=o.lastIndex,o===j?"!--"===l[1]?o=B:void 0!==l[1]?o=q:void 0!==l[2]?(K.test(l[2])&&(r=RegExp("</"+l[2],"g")),o=G):void 0!==l[3]&&(o=G):o===G?">"===l[0]?(o=null!=r?r:j,d=-1):void 0===l[1]?d=-2:(d=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?G:'"'===l[3]?V:W):o===V||o===W?o=G:o===B||o===q?o=j:(o=G,r=void 0);let h=o===G&&t[e+1].startsWith("/>")?" ":"";n+=o===j?s+L:d>=0?(i.push(a),s.slice(0,d)+O+s.slice(d)+I+h):s+I+(-2===d?e:h)}return[tt(t,n+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]})(t,e);if(this.el=te.createElement(l,s),X.currentNode=this.el.content,2===e||3===e){let t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=X.nextNode())&&a.length<o;){if(1===i.nodeType){if(i.hasAttributes())for(let t of i.getAttributeNames())if(t.endsWith(O)){let e=d[n++],s=i.getAttribute(t).split(I),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:s,ctor:"."===o[1]?to:"?"===o[1]?ta:"@"===o[1]?tl:tn}),i.removeAttribute(t)}else t.startsWith(I)&&(a.push({type:6,index:r}),i.removeAttribute(t));if(K.test(i.tagName)){let t=i.textContent.split(I),e=t.length-1;if(e>0){i.textContent=M?M.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],N()),X.nextNode(),a.push({type:2,index:++r});i.append(t[e],N())}}}else if(8===i.nodeType)if(i.data===z)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=i.data.indexOf(I,t+1));)a.push({type:7,index:r}),t+=I.length-1}r++}}}function ts(t,e,s=t,i){var r,n,o;if(e===Z)return e;let a=void 0!==i?null==(r=s._$Co)?void 0:r[i]:s._$Cl,l=T(e)?void 0:e._$litDirective$;return(null==a?void 0:a.constructor)!==l&&(null==a||null==(n=a._$AO)||n.call(a,!1),void 0===l?a=void 0:(a=new l(t))._$AT(t,s,i),void 0!==i?(null!=(o=s._$Co)?o:s._$Co=[])[i]=a:s._$Cl=a),void 0!==a&&(e=ts(t,a._$AS(t,e.values),a,i)),e}class ti{get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:s},parts:i}=this._$AD,r=(null!=(e=null==t?void 0:t.creationScope)?e:R).importNode(s,!0);X.currentNode=r;let n=X.nextNode(),o=0,a=0,l=i[0];for(;void 0!==l;){if(o===l.index){let e;2===l.type?e=new tr(n,n.nextSibling,this,t):1===l.type?e=new l.ctor(n,l.name,l.strings,this,t):6===l.type&&(e=new td(n,this,t)),this._$AV.push(e),l=i[++a]}o!==(null==l?void 0:l.index)&&(n=X.nextNode(),o++)}return X.currentNode=R,r}p(t){let e=0;for(let s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}}class tr{get _$AU(){var t,e;return null!=(e=null==(t=this._$AM)?void 0:t._$AU)?e:this._$Cv}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){let s;T(t=ts(this,t,e))?t===Y||null==t||""===t?(this._$AH!==Y&&this._$AR(),this._$AH=Y):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):H(s=t)||"function"==typeof(null==s?void 0:s[Symbol.iterator])?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Y&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(R.createTextNode(t)),this._$AH=t}$(t){var e;let{values:s,_$litType$:i}=t,r="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=te.createElement(tt(i.h,i.h[0]),this.options)),i);if((null==(e=this._$AH)?void 0:e._$AD)===r)this._$AH.p(s);else{let t=new ti(r,this),e=t.u(this.options);t.p(s),this.T(e),this._$AH=t}}_$AC(t){let e=Q.get(t.strings);return void 0===e&&Q.set(t.strings,e=new te(t)),e}k(t){H(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let r of t)i===e.length?e.push(s=new tr(this.O(N()),this.O(N()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for(null==(s=this._$AP)||s.call(this,!1,!0,e);t!==this._$AB;){let e=P(t).nextSibling;P(t).remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cv=t,null==(e=this._$AP)||e.call(this,t))}constructor(t,e,s,i){var r;this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=null==(r=null==i?void 0:i.isConnected)||r}}class tn{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,s,i){let r=this.strings,n=!1;if(void 0===r)(n=!T(t=ts(this,t,e,0))||t!==this._$AH&&t!==Z)&&(this._$AH=t);else{let i,o,a=t;for(t=r[0],i=0;i<r.length-1;i++)(o=ts(this,a[s+i],e,i))===Z&&(o=this._$AH[i]),n||(n=!T(o)||o!==this._$AH[i]),o===Y?t=Y:t!==Y&&(t+=(null!=o?o:"")+r[i+1]),this._$AH[i]=o}n&&!i&&this.j(t)}j(t){t===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}constructor(t,e,s,i,r){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=Y}}class to extends tn{j(t){this.element[this.name]=t===Y?void 0:t}constructor(){super(...arguments),this.type=3}}class ta extends tn{j(t){this.element.toggleAttribute(this.name,!!t&&t!==Y)}constructor(){super(...arguments),this.type=4}}class tl extends tn{_$AI(t,e=this){var s;if((t=null!=(s=ts(this,t,e,0))?s:Y)===Z)return;let i=this._$AH,r=t===Y&&i!==Y||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==Y&&(i===Y||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;"function"==typeof this._$AH?this._$AH.call(null!=(s=null==(e=this.options)?void 0:e.host)?s:this.element,t):this._$AH.handleEvent(t)}constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}}class td{get _$AU(){return this._$AM._$AU}_$AI(t){ts(this,t)}constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}}let tc=C.litHtmlPolyfillSupport;null==tc||tc(te,tr),(null!=(s=C.litHtmlVersions)?s:C.litHtmlVersions=[]).push("3.3.3");let th=globalThis;class tp extends S{createRenderRoot(){var t;let e=super.createRenderRoot();return null!=(t=this.renderOptions).renderBefore||(t.renderBefore=e.firstChild),e}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{var i,r;let n=null!=(i=null==s?void 0:s.renderBefore)?i:e,o=n._$litPart$;if(void 0===o){let t=null!=(r=null==s?void 0:s.renderBefore)?r:null;n._$litPart$=o=new tr(e.insertBefore(N(),t),t,void 0,null!=s?s:{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null==(t=this._$Do)||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null==(t=this._$Do)||t.setConnected(!1)}render(){return Z}constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}}tp._$litElement$=!0,tp.finalized=!0,null==(i=th.litElementHydrateSupport)||i.call(th,{LitElement:tp});let tu=th.litElementPolyfillSupport;null==tu||tu({LitElement:tp}),(null!=(r=th.litElementVersions)?r:th.litElementVersions=[]).push("4.2.2");let t_=t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},tv={attribute:!0,type:String,converter:w,reflect:!1,hasChanged:E};function tg(t){return(e,s)=>{let i;return"object"==typeof s?((t=tv,e,s)=>{let{kind:i,metadata:r}=s,n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),n.set(s.name,t),"accessor"===i){let{name:i}=s;return{set(s){let r=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,r,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){let{name:i}=s;return function(s){let r=this[i];e.call(this,s),this.requestUpdate(i,r,t,!0,s)}}throw Error("Unsupported decorator location: "+i)})(t,e,s):(i=e.hasOwnProperty(s),e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0)}}function ty(t){return tg({...t,state:!0,attribute:!1})}let tf=[{type:"my-bookings"},{type:"first-available"},{type:"calendar"}];async function tb(t){return t.connection.sendMessagePromise({type:"aptus/entries"})}async function t$(t,e){return t.connection.sendMessagePromise({type:"aptus/laundry/groups",entry_id:e})}async function tm(t,e){return t.connection.sendMessagePromise({type:"aptus/laundry/bookings",entry_id:e})}async function tx(t,e,s=10){return t.connection.sendMessagePromise({type:"aptus/laundry/first_available",entry_id:e,first_x:s})}async function tA(t,e,s,i){let r={type:"aptus/laundry/weekly_calendar",entry_id:e,group_id:s};return i&&(r.pass_date=i),t.connection.sendMessagePromise(r)}async function tw(t,e,s){return t.connection.subscribeMessage(s,{type:"aptus/subscribe",entry_id:e})}let tE=p(n||(n=(t=>t)`
  :host {
    display: block;
    padding: 0 16px 16px;
  }

  .section-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    padding: 12px 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .loading {
    display: flex;
    justify-content: center;
    padding: 16px;
    color: var(--secondary-text-color);
  }

  .empty {
    color: var(--secondary-text-color);
    font-style: italic;
    padding: 8px 0;
  }

  .slot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-color);
  }

  .slot-row:last-child {
    border-bottom: none;
  }

  .slot-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .slot-date {
    font-size: 14px;
    font-weight: 500;
  }

  .slot-time {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .slot-group {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  button {
    cursor: pointer;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .btn-book {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }

  .btn-cancel {
    background: var(--error-color, #db4437);
    color: #fff;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`)),tk=t=>t,tS,tC;class tP extends tp{setResolver(t){this._resolve=t}firstUpdated(){let t=this.renderRoot.querySelector("dialog");if("function"==typeof t.showModal)try{t.showModal()}catch{t.setAttribute("open","")}else t.setAttribute("open","");t.addEventListener("cancel",t=>{t.preventDefault(),this._settle(!1)}),t.addEventListener("close",()=>this._cleanup())}_settle(t){var e;if(this._settled)return;this._settled=!0,null==(e=this._resolve)||e.call(this,t);let s=this.renderRoot.querySelector("dialog");s&&"function"==typeof s.close&&s.open?s.close():this._cleanup()}_cleanup(){if(!this._settled){var t;this._settled=!0,null==(t=this._resolve)||t.call(this,!1)}this.remove()}render(){var t,e;let s=this.opts,i=`btn-confirm${s.destructive?" destructive":""}`;return J(tS||(tS=tk`
      <dialog>
        <div class="body">
          <div class="title">${0}</div>
          <div class="message">${0}</div>
        </div>
        <div class="actions">
          <button class="btn-cancel" @click=${0}>
            ${0}
          </button>
          <button class=${0} @click=${0}>
            ${0}
          </button>
        </div>
      </dialog>
    `),s.title,s.message,()=>this._settle(!1),null!=(t=s.cancelLabel)?t:"Cancel",i,()=>this._settle(!0),null!=(e=s.confirmLabel)?e:"Confirm")}constructor(...t){super(...t),this._settled=!1}}function tM(t){return new Promise(e=>{let s=document.createElement("aptus-confirm-dialog");s.opts=t,s.setResolver(e),document.body.appendChild(s)})}tP.styles=p(tC||(tC=tk`
    dialog {
      border: none;
      border-radius: 8px;
      padding: 0;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      max-width: 360px;
      width: calc(100vw - 32px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }
    .body {
      padding: 16px 20px 8px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--primary-text-color);
    }
    .message {
      font-size: 14px;
      color: var(--secondary-text-color);
      white-space: pre-wrap;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px 16px;
    }
    button {
      cursor: pointer;
      border: none;
      border-radius: 4px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
    }
    .btn-cancel {
      background: transparent;
      color: var(--primary-text-color);
    }
    .btn-cancel:hover {
      background: var(--divider-color);
    }
    .btn-confirm {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-confirm.destructive {
      background: var(--error-color, #db4437);
      color: #fff;
    }
  `)),o([tg({attribute:!1})],tP.prototype,"opts",void 0),tP=o([t_("aptus-confirm-dialog")],tP);let tU=t=>t,tO,tI,tz,tL;class tR extends tp{connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this.refresh())}async refresh(){this._loading=!0;try{this._bookings=await tm(this.hass,this.entryId)}catch{this._bookings=[]}this._loading=!1}async _cancel(t){let e=`${t.date} \xb7 ${t.start_time} \u{2013} ${t.end_time} \xb7 ${t.group_name}`;await tM({title:"Cancel booking?",message:e,confirmLabel:"Cancel booking",cancelLabel:"Keep",destructive:!0})&&(await this.hass.callService("aptus","cancel_laundry",{booking_id:t.id}),this.dispatchEvent(new CustomEvent("aptus-booking-changed",{bubbles:!0,composed:!0})),await this.refresh())}render(){return J(tL||(tL=tU`
      <div class="section-header">My bookings</div>
      ${0}
    `),this._loading?J(tO||(tO=tU`<div class="loading">Loading...</div>`)):0===this._bookings.length?J(tI||(tI=tU`<div class="empty">No upcoming bookings</div>`)):this._bookings.map(t=>J(tz||(tz=tU`
                <div class="slot-row">
                  <div class="slot-info">
                    <span class="slot-date">${0}</span>
                    <span class="slot-time">${0} – ${0}</span>
                    <span class="slot-group">${0}</span>
                  </div>
                  <button class="btn-cancel" @click=${0}>
                    Cancel
                  </button>
                </div>
              `),t.date,t.start_time,t.end_time,t.group_name,()=>this._cancel(t))))}constructor(...t){super(...t),this._bookings=[],this._loading=!1,this._initialized=!1}}tR.styles=tE,o([tg({attribute:!1})],tR.prototype,"hass",void 0),o([tg()],tR.prototype,"entryId",void 0),o([ty()],tR.prototype,"_bookings",void 0),o([ty()],tR.prototype,"_loading",void 0),tR=o([t_("aptus-laundry-bookings")],tR);let tN=t=>t,tT,tH,tD,tj,tB;class tq extends tp{connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this.refresh())}async refresh(){this._loading=!0;try{this._slots=await tx(this.hass,this.entryId,this.count)}catch{this._slots=[]}this._loading=!1}async _book(t){let e=`${t.date} \xb7 ${t.start_time} \u{2013} ${t.end_time}`+(t.group_name?` \xb7 ${t.group_name}`:"");await tM({title:"Book laundry slot?",message:e,confirmLabel:"Book"})&&(await this.hass.callService("aptus","book_laundry",{pass_no:t.pass_no,pass_date:t.date,group_id:t.group_id}),this.dispatchEvent(new CustomEvent("aptus-booking-changed",{bubbles:!0,composed:!0})),await this.refresh())}render(){return J(tB||(tB=tN`
      <div class="section-header">First available</div>
      ${0}
    `),this._loading?J(tT||(tT=tN`<div class="loading">Loading...</div>`)):0===this._slots.length?J(tH||(tH=tN`<div class="empty">No available slots</div>`)):this._slots.map(t=>J(tj||(tj=tN`
                <div class="slot-row">
                  <div class="slot-info">
                    <span class="slot-date">${0}</span>
                    <span class="slot-time">${0} – ${0}</span>
                    ${0}
                  </div>
                  <button class="btn-book" @click=${0}>Book</button>
                </div>
              `),t.date,t.start_time,t.end_time,t.group_name?J(tD||(tD=tN`<span class="slot-group">${0}</span>`),t.group_name):"",()=>this._book(t))))}constructor(...t){super(...t),this.count=10,this._slots=[],this._loading=!1,this._initialized=!1}}tq.styles=tE,o([tg({attribute:!1})],tq.prototype,"hass",void 0),o([tg()],tq.prototype,"entryId",void 0),o([tg({type:Number})],tq.prototype,"count",void 0),o([ty()],tq.prototype,"_slots",void 0),o([ty()],tq.prototype,"_loading",void 0),tq=o([t_("aptus-laundry-first-available")],tq);let tG=t=>t,tW,tV,tK,tF,tJ,tZ,tY,tQ,tX,t0;class t1 extends tp{connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this._loadGroups())}async refresh(){this._selectedGroup&&await this._loadCalendar(this._selectedGroup)}async _loadGroups(){this._loading=!0;try{this._groups=await t$(this.hass,this.entryId),this._groups.length>0&&!this._selectedGroup&&(this._selectedGroup=this._groups[0].id,await this._loadCalendar(this._selectedGroup))}catch{this._groups=[]}this._loading=!1}async _loadCalendar(t){this._loading=!0;try{var e;this._slots=await tA(this.hass,this.entryId,t,null!=(e=this._weekStart)?e:void 0)}catch{this._slots=[]}this._loading=!1}_selectGroup(t){this._selectedGroup=t,this._weekStart=null,this._loadCalendar(t)}_navigateWeek(t){let e=this._uniqueDates();if(0===e.length)return;let s=new Date(t>0?e[e.length-1]:e[0]);s.setDate(s.getDate()+(t>0?1:-7)),this._weekStart=s.toISOString().split("T")[0],this._selectedGroup&&this._loadCalendar(this._selectedGroup)}_uniqueDates(){return[...new Set(this._slots.map(t=>t.date))].sort()}_uniquePassNos(){let t=new Map;for(let e of this._slots)t.has(e.pass_no)||t.set(e.pass_no,`${e.start_time} \u{2013} ${e.end_time}`);return[...t.entries()].sort((t,e)=>t[0]-e[0]).map(([t,e])=>({pass_no:t,label:e}))}async _book(t){let e=`${t.date} \xb7 ${t.start_time} \u{2013} ${t.end_time}`+(t.group_name?` \xb7 ${t.group_name}`:"");await tM({title:"Book laundry slot?",message:e,confirmLabel:"Book"})&&(await this.hass.callService("aptus","book_laundry",{pass_no:t.pass_no,pass_date:t.date,group_id:t.group_id}),this.dispatchEvent(new CustomEvent("aptus-booking-changed",{bubbles:!0,composed:!0})),await this.refresh())}_formatDay(t){return new Date(t+"T00:00:00").toLocaleDateString(void 0,{weekday:"short",day:"numeric"})}render(){let t=this._uniqueDates(),e=this._uniquePassNos();return J(tX||(tX=tG`
      <div class="section-header">Calendar</div>

      ${0}
      ${0}
    `),this._groups.length>1?J(tV||(tV=tG`
            <div class="group-selector">
              ${0}
            </div>
          `),this._groups.map(t=>J(tW||(tW=tG`
                  <button
                    class="group-btn ${0}"
                    @click=${0}
                  >
                    ${0}
                  </button>
                `),t.id===this._selectedGroup?"active":"",()=>this._selectGroup(t.id),t.name))):"",this._loading?J(tK||(tK=tG`<div class="loading">Loading...</div>`)):0===t.length?J(tF||(tF=tG`<div class="empty">No calendar data</div>`)):J(tQ||(tQ=tG`
              <div class="week-nav">
                <button @click=${0}>&larr; Prev</button>
                <span>${0} – ${0}</span>
                <button @click=${0}>Next &rarr;</button>
              </div>
              <div class="calendar-grid" style="--days: ${0}">
                <div class="grid-header"></div>
                ${0}
                ${0}
              </div>
            `),()=>this._navigateWeek(-1),t[0],t[t.length-1],()=>this._navigateWeek(1),t.length,t.map(t=>J(tJ||(tJ=tG`<div class="grid-header">${0}</div>`),this._formatDay(t))),e.map(e=>J(tY||(tY=tG`
                    <div class="grid-label">${0}</div>
                    ${0}
                  `),e.label,t.map(t=>{var s;let i=this._slots.find(s=>s.date===t&&s.pass_no===e.pass_no),r=null!=(s=null==i?void 0:i.state)?s:"unavailable";return J(tZ||(tZ=tG`
                        <div
                          class="grid-cell ${0}"
                          @click=${0}
                          title=${0}
                        >
                          ${0}
                        </div>
                      `),r,"available"===r&&i?()=>this._book(i):void 0,"available"===r?"Click to book":"owned"===r?"Your booking":"Unavailable","available"===r?"⊕":"owned"===r?"●":"")})))))}constructor(...t){super(...t),this._groups=[],this._selectedGroup=null,this._slots=[],this._loading=!1,this._weekStart=null,this._initialized=!1}}t1.styles=[tE,p(t0||(t0=tG`
      .group-selector {
        display: flex;
        gap: 8px;
        padding: 8px 0;
        flex-wrap: wrap;
      }

      .group-btn {
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        border: 1px solid var(--divider-color);
        background: transparent;
        color: var(--primary-text-color);
      }

      .group-btn.active {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        border-color: var(--primary-color);
      }

      .week-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
      }

      .week-nav button {
        background: transparent;
        color: var(--primary-text-color);
        font-size: 16px;
        padding: 4px 8px;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: 90px repeat(var(--days, 7), 1fr);
        gap: 2px;
        font-size: 11px;
      }

      .grid-header {
        text-align: center;
        font-weight: 500;
        padding: 4px 2px;
        font-size: 10px;
        color: var(--secondary-text-color);
      }

      .grid-label {
        display: flex;
        align-items: center;
        font-size: 10px;
        color: var(--secondary-text-color);
        padding: 2px 4px;
      }

      .grid-cell {
        text-align: center;
        padding: 6px 2px;
        border-radius: 4px;
        cursor: default;
        font-size: 10px;
      }

      .grid-cell.available {
        background: var(--success-color, #4caf50);
        color: #fff;
        cursor: pointer;
      }

      .grid-cell.unavailable {
        background: var(--disabled-color, #e0e0e0);
        color: var(--secondary-text-color);
      }

      .grid-cell.owned {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
    `))],o([tg({attribute:!1})],t1.prototype,"hass",void 0),o([tg()],t1.prototype,"entryId",void 0),o([ty()],t1.prototype,"_groups",void 0),o([ty()],t1.prototype,"_selectedGroup",void 0),o([ty()],t1.prototype,"_slots",void 0),o([ty()],t1.prototype,"_loading",void 0),o([ty()],t1.prototype,"_weekStart",void 0),t1=o([t_("aptus-laundry-calendar")],t1);let t2=t=>t,t6,t3,t4,t8,t7,t5,t9,et,ee,es,ei,er;class en extends tp{setConfig(t){var e;this._config=t,this._sections=null!=(e=t.sections)?e:tf,this.isConnected&&this._loadEntries()}getCardSize(){return 3+3*this._sections.length}connectedCallback(){super.connectedCallback(),this.addEventListener("aptus-booking-changed",this._onBookingChanged),this._tickInterval=setInterval(()=>this.requestUpdate(),6e4),this._loadEntries()}disconnectedCallback(){this.removeEventListener("aptus-booking-changed",this._onBookingChanged),void 0!==this._tickInterval&&(clearInterval(this._tickInterval),this._tickInterval=void 0),this._unsubscribe(),super.disconnectedCallback()}async _loadEntries(){if(!this._entriesLoaded&&this._config){if(this._config.entry_id){this._selectedEntryId=this._config.entry_id,this._entriesLoaded=!0,this._ensureSubscribed();return}try{this._entries=await tb(this.hass),1===this._entries.length&&(this._selectedEntryId=this._entries[0].entry_id,this._ensureSubscribed()),this._entriesLoaded=!0}catch{this._entries=[]}}}async _ensureSubscribed(){if(!this._unsub&&this._selectedEntryId&&this.hass)try{this._unsub=await tw(this.hass,this._selectedEntryId,this._onBookingChanged)}catch{}}_unsubscribe(){var t;null==(t=this._unsub)||t.call(this),this._unsub=void 0}_onEntrySelect(t){let e=t.target.value;e!==this._selectedEntryId&&(this._unsubscribe(),this._selectedEntryId=e,this._ensureSubscribed())}_renderLastSynced(){var t,e;if(!this._lastSynced)return Y;let s=null==(e=this.hass)||null==(t=e.locale)?void 0:t.language,i=this._lastSynced.toLocaleTimeString(s),r=Math.floor((Date.now()-this._lastSynced.getTime())/6e4),n=r<1?"just now":`${r}m ago`;return J(t6||(t6=t2`<div class="last-synced">synced at ${0} (${0})</div>`),i,n)}_renderSection(t){let e=this._selectedEntryId;switch(t.type){case"my-bookings":return J(t3||(t3=t2`<aptus-laundry-bookings
          .hass=${0}
          .entryId=${0}
        ></aptus-laundry-bookings>`),this.hass,e);case"first-available":var s;return J(t4||(t4=t2`<aptus-laundry-first-available
          .hass=${0}
          .entryId=${0}
          .count=${0}
        ></aptus-laundry-first-available>`),this.hass,e,null!=(s=this._config.first_available_count)?s:10);case"calendar":return J(t8||(t8=t2`<aptus-laundry-calendar
          .hass=${0}
          .entryId=${0}
        ></aptus-laundry-calendar>`),this.hass,e)}}render(){return this._config&&this.hass?J(ei||(ei=t2`
      <ha-card>
        ${0}
        ${0}
        ${0}
        ${0}
      </ha-card>
    `),this._config.title?J(t5||(t5=t2`<div class="card-header">${0}</div>`),this._config.title):"",this._entries.length>1?J(et||(et=t2`
              <div class="entry-select">
                <select @change=${0}>
                  <option value="" disabled ?selected=${0}>
                    Select account...
                  </option>
                  ${0}
                </select>
              </div>
            `),this._onEntrySelect,!this._selectedEntryId,this._entries.map(t=>J(t9||(t9=t2`
                      <option
                        value=${0}
                        ?selected=${0}
                      >
                        ${0}
                      </option>
                    `),t.entry_id,t.entry_id===this._selectedEntryId,t.title))):"",this._selectedEntryId?this._sections.map(t=>this._renderSection(t)):this._entries.length>1?J(ee||(ee=t2`<div style="padding: 16px; color: var(--secondary-text-color)">
                Select an account above
              </div>`)):J(es||(es=t2`<div style="padding: 16px; color: var(--secondary-text-color)">
                Loading...
              </div>`)),this._renderLastSynced()):J(t7||(t7=t2``))}static getStubConfig(){return{title:"Laundry",sections:tf}}constructor(...t){super(...t),this._entries=[],this._selectedEntryId=null,this._lastSynced=null,this._sections=tf,this._entriesLoaded=!1,this._onBookingChanged=t=>{var e;t&&!(t instanceof Event)&&"object"==typeof t&&"last_synced"in t&&(this._lastSynced=t.last_synced?new Date(t.last_synced):null),null==(e=this.shadowRoot)||e.querySelectorAll("aptus-laundry-bookings, aptus-laundry-first-available, aptus-laundry-calendar").forEach(t=>{"refresh"in t&&"function"==typeof t.refresh&&t.refresh()})}}}en.styles=p(er||(er=t2`
    :host {
      display: block;
    }
    .entry-select {
      padding: 8px 16px;
    }
    .entry-select select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 14px;
    }
    .last-synced {
      color: var(--secondary-text-color);
      font-size: 11px;
      padding: 4px 12px;
      text-align: right;
      opacity: 0.75;
    }
  `)),o([tg({attribute:!1})],en.prototype,"hass",void 0),o([ty()],en.prototype,"_config",void 0),o([ty()],en.prototype,"_entries",void 0),o([ty()],en.prototype,"_selectedEntryId",void 0),o([ty()],en.prototype,"_lastSynced",void 0),en=o([t_("aptus-laundry-card")],en),window.customCards=window.customCards||[],window.customCards.push({type:"aptus-laundry-card",name:"Aptus Laundry Card",description:"Manage laundry bookings via Aptus portal"});export{en as AptusLaundryCard};