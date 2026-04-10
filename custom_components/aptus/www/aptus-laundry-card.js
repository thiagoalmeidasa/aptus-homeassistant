function t(t,e,s,i){var o,r=arguments.length,n=r<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,s,n):o(e,s))||n);return r>3&&n&&Object.defineProperty(e,s,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),o=new WeakMap;let r=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&o.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new r(s,t,i)},a=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,_=globalThis,g=_.trustedTypes,y=g?g.emptyScript:"",f=_.reactiveElementPolyfillSupport,v=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?y:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},b=(t,e)=>!l(t,e),m={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let A=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=m){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&d(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:o}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const r=i?.call(this);o?.call(this,e),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??m}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(s)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of i){const i=document.createElement("style"),o=e.litNonce;void 0!==o&&i.setAttribute("nonce",o),i.textContent=s.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:$).toAttribute(e,s.type);this._$Em=t,null==o?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=i;const r=o.fromAttribute(e,t.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){if(void 0!==t){const r=this.constructor;if(!1===i&&(o=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??b)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};A.elementStyles=[],A.shadowRootOptions={mode:"open"},A[v("elementProperties")]=new Map,A[v("finalized")]=new Map,f?.({ReactiveElement:A}),(_.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,w=t=>t,E=x.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,U=`<${P}>`,O=document,M=()=>O.createComment(""),N=t=>null===t||"object"!=typeof t&&"function"!=typeof t,z=Array.isArray,T="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,I=/>/g,D=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,j=/"/g,B=/^(?:script|style|textarea|title)$/i,G=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),q=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),V=new WeakMap,F=O.createTreeWalker(O,129);function J(t,e){if(!z(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const K=(t,e)=>{const s=t.length-1,i=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=H;for(let e=0;e<s;e++){const s=t[e];let a,l,d=-1,c=0;for(;c<s.length&&(n.lastIndex=c,l=n.exec(s),null!==l);)c=n.lastIndex,n===H?"!--"===l[1]?n=R:void 0!==l[1]?n=I:void 0!==l[2]?(B.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=D):void 0!==l[3]&&(n=D):n===D?">"===l[0]?(n=o??H,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?D:'"'===l[3]?j:L):n===j||n===L?n=D:n===R||n===I?n=H:(n=D,o=void 0);const h=n===D&&t[e+1].startsWith("/>")?" ":"";r+=n===H?s+U:d>=0?(i.push(a),s.slice(0,d)+k+s.slice(d)+C+h):s+C+(-2===d?e:h)}return[J(t,r+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Z{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[l,d]=K(t,e);if(this.el=Z.createElement(l,s),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=F.nextNode())&&a.length<n;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(k)){const e=d[r++],s=i.getAttribute(t).split(C),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:s,ctor:"."===n[1]?et:"?"===n[1]?st:"@"===n[1]?it:tt}),i.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:o}),i.removeAttribute(t));if(B.test(i.tagName)){const t=i.textContent.split(C),e=t.length-1;if(e>0){i.textContent=E?E.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],M()),F.nextNode(),a.push({type:2,index:++o});i.append(t[e],M())}}}else if(8===i.nodeType)if(i.data===P)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=i.data.indexOf(C,t+1));)a.push({type:7,index:o}),t+=C.length-1}o++}}static createElement(t,e){const s=O.createElement("template");return s.innerHTML=t,s}}function Y(t,e,s=t,i){if(e===q)return e;let o=void 0!==i?s._$Co?.[i]:s._$Cl;const r=N(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=o:s._$Cl=o),void 0!==o&&(e=Y(t,o._$AS(t,e.values),o,i)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??O).importNode(e,!0);F.currentNode=i;let o=F.nextNode(),r=0,n=0,a=s[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new X(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new ot(o,this,t)),this._$AV.push(e),a=s[++n]}r!==a?.index&&(o=F.nextNode(),r++)}return F.currentNode=O,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),N(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>z(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&N(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Z.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Q(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new Z(t)),e}k(t){z(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const o of t)i===e.length?e.push(s=new X(this.O(M()),this.O(M()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=W}_$AI(t,e=this,s,i){const o=this.strings;let r=!1;if(void 0===o)t=Y(this,t,e,0),r=!N(t)||t!==this._$AH&&t!==q,r&&(this._$AH=t);else{const i=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=Y(this,i[s+n],e,n),a===q&&(a=this._$AH[n]),r||=!N(a)||a!==this._$AH[n],a===W?t=W:t!==W&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!i&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class st extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class it extends tt{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??W)===q)return;const s=this._$AH,i=t===W&&s!==W||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==W&&(s===W||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const rt=x.litHtmlPolyfillSupport;rt?.(Z,X),(x.litHtmlVersions??=[]).push("3.3.2");const nt=globalThis;class at extends A{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let o=i._$litPart$;if(void 0===o){const t=s?.renderBefore??null;i._$litPart$=o=new X(e.insertBefore(M(),t),t,void 0,s??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}at._$litElement$=!0,at.finalized=!0,nt.litElementHydrateSupport?.({LitElement:at});const lt=nt.litElementPolyfillSupport;lt?.({LitElement:at}),(nt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ct={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:b},ht=(t=ct,e,s)=>{const{kind:i,metadata:o}=s;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),r.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const o=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,o,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const o=this[i];e.call(this,s),this.requestUpdate(i,o,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function pt(t){return(e,s)=>"object"==typeof s?ht(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function ut(t){return pt({...t,state:!0,attribute:!1})}const _t=[{type:"my-bookings"},{type:"first-available"},{type:"calendar"}];const gt=n`
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
`;let yt=class extends at{constructor(){super(...arguments),this._bookings=[],this._loading=!1,this._initialized=!1}connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this.refresh())}async refresh(){this._loading=!0;try{this._bookings=await async function(t,e){return t.connection.sendMessagePromise({type:"aptus/laundry/bookings",entry_id:e})}(this.hass,this.entryId)}catch{this._bookings=[]}this._loading=!1}async _cancel(t){await this.hass.callService("aptus","cancel_laundry",{booking_id:t}),this.dispatchEvent(new CustomEvent("aptus-booking-changed",{bubbles:!0,composed:!0})),await this.refresh()}render(){return G`
      <div class="section-header">My bookings</div>
      ${this._loading?G`<div class="loading">Loading...</div>`:0===this._bookings.length?G`<div class="empty">No upcoming bookings</div>`:this._bookings.map(t=>G`
                <div class="slot-row">
                  <div class="slot-info">
                    <span class="slot-date">${t.date}</span>
                    <span class="slot-time">${t.start_time} – ${t.end_time}</span>
                    <span class="slot-group">${t.group_name}</span>
                  </div>
                  <button class="btn-cancel" @click=${()=>this._cancel(t.id)}>
                    Cancel
                  </button>
                </div>
              `)}
    `}};yt.styles=gt,t([pt({attribute:!1})],yt.prototype,"hass",void 0),t([pt()],yt.prototype,"entryId",void 0),t([ut()],yt.prototype,"_bookings",void 0),t([ut()],yt.prototype,"_loading",void 0),yt=t([dt("aptus-laundry-bookings")],yt);let ft=class extends at{constructor(){super(...arguments),this.count=10,this._slots=[],this._loading=!1,this._initialized=!1}connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this.refresh())}async refresh(){this._loading=!0;try{this._slots=await async function(t,e,s=10){return t.connection.sendMessagePromise({type:"aptus/laundry/first_available",entry_id:e,first_x:s})}(this.hass,this.entryId,this.count)}catch{this._slots=[]}this._loading=!1}async _book(t){await this.hass.callService("aptus","book_laundry",{pass_no:t.pass_no,pass_date:t.date,group_id:t.group_id}),this.dispatchEvent(new CustomEvent("aptus-booking-changed",{bubbles:!0,composed:!0})),await this.refresh()}render(){return G`
      <div class="section-header">First available</div>
      ${this._loading?G`<div class="loading">Loading...</div>`:0===this._slots.length?G`<div class="empty">No available slots</div>`:this._slots.map(t=>G`
                <div class="slot-row">
                  <div class="slot-info">
                    <span class="slot-date">${t.date}</span>
                    <span class="slot-time">${t.start_time} – ${t.end_time}</span>
                  </div>
                  <button class="btn-book" @click=${()=>this._book(t)}>Book</button>
                </div>
              `)}
    `}};ft.styles=gt,t([pt({attribute:!1})],ft.prototype,"hass",void 0),t([pt()],ft.prototype,"entryId",void 0),t([pt({type:Number})],ft.prototype,"count",void 0),t([ut()],ft.prototype,"_slots",void 0),t([ut()],ft.prototype,"_loading",void 0),ft=t([dt("aptus-laundry-first-available")],ft);let vt=class extends at{constructor(){super(...arguments),this._groups=[],this._selectedGroup=null,this._slots=[],this._loading=!1,this._weekStart=null,this._initialized=!1}connectedCallback(){super.connectedCallback(),this._initialized||(this._initialized=!0,this._loadGroups())}async refresh(){this._selectedGroup&&await this._loadCalendar(this._selectedGroup)}async _loadGroups(){this._loading=!0;try{this._groups=await async function(t,e){return t.connection.sendMessagePromise({type:"aptus/laundry/groups",entry_id:e})}(this.hass,this.entryId),this._groups.length>0&&!this._selectedGroup&&(this._selectedGroup=this._groups[0].id,await this._loadCalendar(this._selectedGroup))}catch{this._groups=[]}this._loading=!1}async _loadCalendar(t){this._loading=!0;try{this._slots=await async function(t,e,s,i){const o={type:"aptus/laundry/weekly_calendar",entry_id:e,group_id:s};return i&&(o.pass_date=i),t.connection.sendMessagePromise(o)}(this.hass,this.entryId,t,this._weekStart??void 0)}catch{this._slots=[]}this._loading=!1}_selectGroup(t){this._selectedGroup=t,this._weekStart=null,this._loadCalendar(t)}_navigateWeek(t){const e=this._uniqueDates();if(0===e.length)return;const s=new Date(t>0?e[e.length-1]:e[0]);s.setDate(s.getDate()+(t>0?1:-7)),this._weekStart=s.toISOString().split("T")[0],this._selectedGroup&&this._loadCalendar(this._selectedGroup)}_uniqueDates(){return[...new Set(this._slots.map(t=>t.date))].sort()}_uniquePassNos(){const t=new Map;for(const e of this._slots)t.has(e.pass_no)||t.set(e.pass_no,`${e.start_time} – ${e.end_time}`);return[...t.entries()].sort((t,e)=>t[0]-e[0]).map(([t,e])=>({pass_no:t,label:e}))}async _book(t){await this.hass.callService("aptus","book_laundry",{pass_no:t.pass_no,pass_date:t.date,group_id:t.group_id}),this.dispatchEvent(new CustomEvent("aptus-booking-changed",{bubbles:!0,composed:!0})),await this.refresh()}_formatDay(t){return new Date(t+"T00:00:00").toLocaleDateString(void 0,{weekday:"short",day:"numeric"})}render(){const t=this._uniqueDates(),e=this._uniquePassNos();return G`
      <div class="section-header">Calendar</div>

      ${this._groups.length>1?G`
            <div class="group-selector">
              ${this._groups.map(t=>G`
                  <button
                    class="group-btn ${t.id===this._selectedGroup?"active":""}"
                    @click=${()=>this._selectGroup(t.id)}
                  >
                    ${t.name}
                  </button>
                `)}
            </div>
          `:""}
      ${this._loading?G`<div class="loading">Loading...</div>`:0===t.length?G`<div class="empty">No calendar data</div>`:G`
              <div class="week-nav">
                <button @click=${()=>this._navigateWeek(-1)}>&larr; Prev</button>
                <span>${t[0]} – ${t[t.length-1]}</span>
                <button @click=${()=>this._navigateWeek(1)}>Next &rarr;</button>
              </div>
              <div class="calendar-grid" style="--days: ${t.length}">
                <div class="grid-header"></div>
                ${t.map(t=>G`<div class="grid-header">${this._formatDay(t)}</div>`)}
                ${e.map(e=>G`
                    <div class="grid-label">${e.label}</div>
                    ${t.map(t=>{const s=this._slots.find(s=>s.date===t&&s.pass_no===e.pass_no),i=s?.state??"unavailable";return G`
                        <div
                          class="grid-cell ${i}"
                          @click=${"available"===i&&s?()=>this._book(s):void 0}
                          title=${"available"===i?"Click to book":"owned"===i?"Your booking":"Unavailable"}
                        >
                          ${"available"===i?"⊕":"owned"===i?"●":""}
                        </div>
                      `})}
                  `)}
              </div>
            `}
    `}};vt.styles=[gt,n`
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
    `],t([pt({attribute:!1})],vt.prototype,"hass",void 0),t([pt()],vt.prototype,"entryId",void 0),t([ut()],vt.prototype,"_groups",void 0),t([ut()],vt.prototype,"_selectedGroup",void 0),t([ut()],vt.prototype,"_slots",void 0),t([ut()],vt.prototype,"_loading",void 0),t([ut()],vt.prototype,"_weekStart",void 0),vt=t([dt("aptus-laundry-calendar")],vt);let $t=class extends at{constructor(){super(...arguments),this._entries=[],this._selectedEntryId=null,this._sections=_t,this._entriesLoaded=!1,this._onBookingChanged=()=>{this.shadowRoot?.querySelectorAll("aptus-laundry-bookings, aptus-laundry-first-available, aptus-laundry-calendar").forEach(t=>{"refresh"in t&&"function"==typeof t.refresh&&t.refresh()})}}setConfig(t){this._config=t,this._sections=t.sections??_t}getCardSize(){return 3+3*this._sections.length}connectedCallback(){super.connectedCallback(),this.addEventListener("aptus-booking-changed",this._onBookingChanged),this._loadEntries()}disconnectedCallback(){this.removeEventListener("aptus-booking-changed",this._onBookingChanged),super.disconnectedCallback()}async _loadEntries(){if(!this._entriesLoaded){if(this._config.entry_id)return this._selectedEntryId=this._config.entry_id,void(this._entriesLoaded=!0);try{this._entries=await async function(t){return t.connection.sendMessagePromise({type:"aptus/entries"})}(this.hass),1===this._entries.length&&(this._selectedEntryId=this._entries[0].entry_id),this._entriesLoaded=!0}catch{this._entries=[]}}}_onEntrySelect(t){this._selectedEntryId=t.target.value}_renderSection(t){const e=this._selectedEntryId;switch(t.type){case"my-bookings":return G`<aptus-laundry-bookings
          .hass=${this.hass}
          .entryId=${e}
        ></aptus-laundry-bookings>`;case"first-available":return G`<aptus-laundry-first-available
          .hass=${this.hass}
          .entryId=${e}
          .count=${this._config.first_available_count??10}
        ></aptus-laundry-first-available>`;case"calendar":return G`<aptus-laundry-calendar
          .hass=${this.hass}
          .entryId=${e}
        ></aptus-laundry-calendar>`}}render(){return this._config&&this.hass?G`
      <ha-card>
        ${this._config.title?G`<div class="card-header">${this._config.title}</div>`:""}
        ${this._entries.length>1?G`
              <div class="entry-select">
                <select @change=${this._onEntrySelect}>
                  <option value="" disabled ?selected=${!this._selectedEntryId}>
                    Select account...
                  </option>
                  ${this._entries.map(t=>G`
                      <option
                        value=${t.entry_id}
                        ?selected=${t.entry_id===this._selectedEntryId}
                      >
                        ${t.title}
                      </option>
                    `)}
                </select>
              </div>
            `:""}
        ${this._selectedEntryId?this._sections.map(t=>this._renderSection(t)):this._entries.length>1?G`<div style="padding: 16px; color: var(--secondary-text-color)">
                Select an account above
              </div>`:G`<div style="padding: 16px; color: var(--secondary-text-color)">
                Loading...
              </div>`}
      </ha-card>
    `:G``}static getStubConfig(){return{title:"Laundry",sections:_t}}};$t.styles=n`
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
  `,t([pt({attribute:!1})],$t.prototype,"hass",void 0),t([ut()],$t.prototype,"_config",void 0),t([ut()],$t.prototype,"_entries",void 0),t([ut()],$t.prototype,"_selectedEntryId",void 0),$t=t([dt("aptus-laundry-card")],$t),window.customCards=window.customCards||[],window.customCards.push({type:"aptus-laundry-card",name:"Aptus Laundry Card",description:"Manage laundry bookings via Aptus portal"});export{$t as AptusLaundryCard};
//# sourceMappingURL=aptus-laundry-card.js.map
