# Graph Report - application-extension  (2026-11-07)

## Corpus Check
- 13 files · ~32,425 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 4817 nodes · 11371 edges · 187 communities (86 shown, 101 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b190a73`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pdf.worker.min.mjs
- .get
- ConfigNamespace
- OptionObject
- .getOperatorList
- XFAObjectArray
- .add
- StringObject
- TemplateNamespace
- pdf.min.mjs
- AnnotationElement
- .push
- Dict
- XFAObject
- DrawingEditor
- LocaleSetNamespace
- .toString
- AnnotationEditor
- .success
- PDFImage
- Option01
- warn
- DecodeStream
- .process
- ContentObject
- AnnotationEditorLayer
- WidgetAnnotation
- .getTextContent
- CanvasGraphics
- .checkAndRepair
- FreeTextEditor
- HighlightEditor
- AnnotationEditorUIManager
- .getObj
- getStringOption
- AES256Cipher
- parse.test.mjs
- IntegerObject
- .onSymbolDictionary
- TextLayer
- CanvasExtraState
- PDFDocumentProxy
- .compile
- ConnectionSetNamespace
- PDFPageProxy
- CFFCompiler
- assert
- valueToHtml
- shadow
- Annotation
- CFFParser
- WorkerTransport
- .restore
- unreachable
- Parser
- .constructor
- PopupElement
- StampEditor
- PDFNetworkStreamFullRequestReader
- PDFWorker
- ExclGroup
- readBit
- Page
- extractFilenameFromHeader
- .constructor
- FormatError
- AltText
- .getPattern
- .compileGlyph
- .add
- Glyph
- ImageManager
- AnnotationStorage
- InkDrawOutline
- BasePdfManager
- find
- ColorPicker
- .fallbackToSystemFont
- ChunkedStream
- InkDrawOutliner
- info
- SimpleDOMNode
- .setEditingState
- getCurrentTransform
- manifest.json
- Subform
- ColorSpace
- ChunkedStreamManager
- setupDoc
- .remove
- DrawingOptions
- ColorConverters
- XMLParserBase
- ._createMaskCanvas
- FreeDrawOutliner
- .resolve
- Area
- ._bindElement
- XmlObject
- CalRGBCS
- Stream
- fill-utils.js
- PDFNodeStreamFsFullReader
- Builder
- XhtmlObject
- NullOptimizer
- XhtmlNamespace
- PostScriptToken
- workday.js
- Outline
- PDFDataTransportStreamReader
- LinkAnnotationElement
- LabCS
- Util
- HuffmanTable
- GlobalImageCache
- Word64
- JpegImage
- PDFFetchStream
- CFFDict
- JpegStream
- XFAFactory
- TextMeasure
- Datasets
- XFAAttribute
- CFFStrings
- Color
- PDFWorkerStream
- .execute
- HighlightOutliner
- PDFNodeStreamFsRangeReader
- PDFNetworkStreamRangeRequestReader
- Button
- SimpleGlyph
- MetadataParser
- PDFWorkerStreamReader
- XFAParser
- BaseFilterFactory
- FreeDrawOutline
- AnnotationBorderStyle
- FontSelector
- PageArea
- BaseCanvasFactory
- HighlightOutline
- RenderTask
- AppearanceStreamEvaluator
- DeviceCmykCS
- DeviceRgbCS
- EvaluatorPreprocessor
- LocalPdfManager
- NetworkPdfManager
- xdp_Xdp
- ArithmeticDecoder
- .constructor
- br
- Root
- DeviceGrayCS
- DeviceRgbaCS
- ExData
- IndexedCS
- Ref
- signature_Signature
- Stylesheet
- Template
- Traverse
- Job Application Autofill (Edge / Chrome extension)
- Body
- Border
- Html
- ImageEdit
- Linear
- Occur
- Overflow
- B
- Encryption
- EncryptionMethods
- P
- Reasons
- Sub

## God Nodes (most connected - your core abstractions)
1. `XFAObject` - 203 edges
2. `warn()` - 163 edges
3. `ConfigNamespace` - 141 edges
4. `AnnotationEditor` - 135 edges
5. `TemplateNamespace` - 115 edges
6. `AnnotationEditorUIManager` - 114 edges
7. `CanvasGraphics` - 101 edges
8. `shadow()` - 93 edges
9. `FormatError` - 88 edges
10. `getStringOption()` - 85 edges

## Surprising Connections (you probably didn't know these)
- `rebuild()` --calls--> `mergeProfiles()`  [EXTRACTED]
  options.js → merge.js
- `readPdf()` --calls--> `parseResume()`  [EXTRACTED]
  options.js → parse.js
- `readPdf()` --calls--> `pdfToLines()`  [EXTRACTED]
  options.js → parse.js

## Import Cycles
- None detected.

## Communities (187 total, 101 thin omitted)

### Community 0 - "pdf.worker.min.mjs"
Cohesion: 0.01
Nodes (176): Aa, An, Ao, Ar, As, ba, Bi, bidi() (+168 more)

### Community 1 - ".get"
Cohesion: 0.04
Nodes (24): adjustMapping(), Catalog, appendIfJavaScriptDict(), addPageDict(), addPageError(), clearGlobalCaches(), _collectJS(), createValidAbsoluteUrl() (+16 more)

### Community 2 - "ConfigNamespace"
Cohesion: 0.02
Nodes (34): Acrobat7, BatchOutput, Cache, Compress, Compression, config_Encryption, config_Message, config_Script (+26 more)

### Community 3 - "OptionObject"
Cohesion: 0.02
Nodes (35): ADBE_JSConsole, ADBE_JSDebugger, Attributes, AutoSave, config_Validate, Conformance, Destination, DigestMethod (+27 more)

### Community 4 - ".getOperatorList"
Cohesion: 0.05
Nodes (20): addLocallyCachedImageOps(), EvalState, getQuadPoints(), getTilingPatternIR(), isKnownFontName(), isNumberArray(), isPDFFunction(), lookupMatrix() (+12 more)

### Community 5 - "XFAObjectArray"
Cohesion: 0.02
Nodes (28): Acrobat, Agent, Common, Config, config_FontInfo, ConnectionSet, Data, Desc (+20 more)

### Community 6 - ".add"
Cohesion: 0.05
Nodes (12): bindEvents(), CheckboxWidgetAnnotationElement, ChoiceWidgetAnnotationElement, EditorToolbar, HighlightToolbar, n, noContextMenu(), RadioButtonWidgetAnnotationElement (+4 more)

### Community 7 - "StringObject"
Cohesion: 0.02
Nodes (29): Amd, AppearanceFilter, Base, Certificate, config_Picture, Creator, Enforce, ExcludeNS (+21 more)

### Community 8 - "TemplateNamespace"
Cohesion: 0.02
Nodes (28): Barcode, Bind, BindItems, Bookend, BreakAfter, BreakBefore, Certificates, Comb (+20 more)

### Community 9 - "pdf.min.mjs"
Cohesion: 0.04
Nodes (52): addAlphaFilter(), addFilter(), addHCMFilter(), addHighlightHCMFilter(), addLuminosityFilter(), b, BaseCMapReaderFactory, BaseStandardFontDataFactory (+44 more)

### Community 10 - "AnnotationElement"
Cohesion: 0.04
Nodes (20): AnnotationElement, AnnotationElementFactory, CaretAnnotationElement, CircleAnnotationElement, FileAttachmentAnnotationElement, FreeTextAnnotationElement, getRectDims(), HighlightAnnotationElement (+12 more)

### Community 11 - ".push"
Cohesion: 0.05
Nodes (33): AnnotationFactory, buildHuffmanTable(), computeIDs(), createDataNode(), encodeToXmlString(), escapePDFName(), sanitizeTTProgram(), generateFont() (+25 more)

### Community 12 - "Dict"
Cohesion: 0.06
Nodes (26): CaretAnnotation, CircleAnnotation, Dict, FakeUnicodeFont, FileAttachmentAnnotation, FreeTextAnnotation, getPdfColor(), getPdfColorArray() (+18 more)

### Community 13 - "XFAObject"
Cohesion: 0.03
Nodes (18): Arc, Assist, Break, Calculate, config_Area, Event, Hyphenation, Items (+10 more)

### Community 15 - "LocaleSetNamespace"
Cohesion: 0.03
Nodes (25): CalendarSymbols, CurrencySymbol, CurrencySymbols, DatePattern, DatePatterns, DateTimeSymbols, Day, DayNames (+17 more)

### Community 16 - ".toString"
Cohesion: 0.06
Nodes (11): addChildren(), parseNestedOrder(), parseOnOff(), parseOrder(), getModificationDate(), MurmurHash3_64, RefSet, RefSetCache (+3 more)

### Community 18 - ".success"
Cohesion: 0.07
Nodes (34): applyAssist(), ariaLabel(), CheckButton, checkDimensions(), ChoiceList, computeBbox(), ContentArea, Corner (+26 more)

### Community 19 - "PDFImage"
Cohesion: 0.05
Nodes (17): AbortException, assert(), convertBlackAndWhiteToRGBA(), convertToRGBA(), decodeAndClamp(), Fill, ImageResizer, MessageHandler (+9 more)

### Community 20 - "Option01"
Cohesion: 0.03
Nodes (20): AddSilentPrint, AddViewerPreferences, Change, CompressLogicalStructure, config_Encrypt, ContentCopy, DocumentAssembly, Embed (+12 more)

### Community 21 - "warn"
Cohesion: 0.05
Nodes (10): bytesToString(), FontFaceObject, FontLoader, MurmurHash3_64, OptionalContentConfig, OptionalContentGroup, StatTimer, tt (+2 more)

### Community 22 - "DecodeStream"
Cohesion: 0.05
Nodes (14): Ascii85Stream, AsciiHexStream, CCITTFaxStream, CipherTransform, DecodeStream, DecryptStream, Jbig2Stream, JpxStream (+6 more)

### Community 23 - ".process"
Cohesion: 0.06
Nodes (21): addHex(), BinaryCMapReader, BinaryCMapStream, CMap, createBuiltInCMap(), expectInt(), expectString(), extendCMap() (+13 more)

### Community 24 - "ContentObject"
Cohesion: 0.04
Nodes (14): AlwaysEmbed, BehaviorOverride, ContentObject, DefaultTypeface, Exclude, NeverEmbed, Range, Record (+6 more)

### Community 25 - "AnnotationEditorLayer"
Cohesion: 0.06
Nodes (3): AnnotationEditorLayer, destroy(), DrawLayer

### Community 26 - "WidgetAnnotation"
Cohesion: 0.07
Nodes (15): ButtonWidgetAnnotation, ChoiceWidgetAnnotation, collectActions(), DatasetReader, decodeString(), DefaultAppearanceEvaluator, ErrorFont, escapeString() (+7 more)

### Community 27 - ".getTextContent"
Cohesion: 0.06
Nodes (22): BaseLocalCache, LocalFunctionCache, LocalGStateCache, LocalImageCache, LocalTilingPatternCache, addFakeSpaces(), appendEOL(), applyInverseRotation() (+14 more)

### Community 29 - ".checkAndRepair"
Cohesion: 0.06
Nodes (23): adjustWidths(), amendFallbackToUnicode(), CFFFont, convertCidString(), Font, readNameTable(), readOpenTypeHeader(), readTableEntry() (+15 more)

### Community 30 - "FreeTextEditor"
Cohesion: 0.06
Nodes (3): ColorManager, FreeTextEditor, getRGB()

### Community 31 - "HighlightEditor"
Cohesion: 0.06
Nodes (3): HighlightEditor, normalizeUnicode(), PDFObjects

### Community 33 - ".getObj"
Cohesion: 0.09
Nodes (11): ct, InvalidPDFException, isCmd(), Lexer, Linearization, getInt(), ParserEOFException, toHexDigit() (+3 more)

### Community 34 - "getStringOption"
Cohesion: 0.09
Nodes (8): getFloat(), getInteger(), getKeyword(), getMeasurement(), getRatio(), getRelevant(), getStringOption(), LockDocument

### Community 35 - "AES256Cipher"
Cohesion: 0.08
Nodes (11): AES128Cipher, AES256Cipher, AESBaseCipher, ARCFourCipher, CipherTransformFactory, eo, isArrayEqual(), NullCipher (+3 more)

### Community 36 - "parse.test.mjs"
Cohesion: 0.09
Nodes (31): addExtra(), mergeProfiles(), norm(), projKey(), sameExp(), sameProj(), similar(), words() (+23 more)

### Community 37 - "IntegerObject"
Cohesion: 0.05
Nodes (13): AdjustData, AdobeExtensionLevel, CompressObjectStream, Copies, CurrentPage, IntegerObject, Level, MsgId (+5 more)

### Community 38 - ".onSymbolDictionary"
Cohesion: 0.12
Nodes (16): ContextCache, decodeBitmap(), decodeIAID(), decodeInteger(), decodeMMRBitmap(), decodeRefinement(), decodeTextRegion(), DecodingContext (+8 more)

### Community 39 - "TextLayer"
Cohesion: 0.09
Nodes (6): AbortException, AnnotationLayer, BaseSVGFactory, DOMSVGFactory, setLayerDimensions(), TextLayer

### Community 40 - "CanvasExtraState"
Cohesion: 0.09
Nodes (5): CanvasExtraState, getImageSmoothingEnabled(), getXfaPageViewport(), PageViewport, Util

### Community 42 - ".compile"
Cohesion: 0.09
Nodes (13): AstArgument, AstBinaryOperation, AstLiteral, AstMin, AstNode, AstVariable, AstVariableDefinition, buildAddOperation() (+5 more)

### Community 43 - "ConnectionSetNamespace"
Cohesion: 0.06
Nodes (12): connection_set_Uri, ConnectionSetNamespace, EffectiveInputPolicy, EffectiveOutputPolicy, Operation, RootElement, SoapAction, SoapAddress (+4 more)

### Community 45 - "CFFCompiler"
Cohesion: 0.12
Nodes (4): CFFCompiler, CFFIndex, CFFOffsetTracker, stringToBytes()

### Community 46 - "assert"
Cohesion: 0.08
Nodes (5): assert(), PDFDataRangeTransport, PDFDataTransportStream, PDFDataTransportStreamRangeReader, PDFNodeStream

### Community 47 - "valueToHtml"
Cohesion: 0.06
Nodes (8): BooleanElement, DateElement, DateTime, Decimal, Float, Integer, Time, valueToHtml()

### Community 48 - "shadow"
Cohesion: 0.08
Nodes (3): KeyboardManager, shadow(), util_FeatureTest

### Community 49 - "Annotation"
Cohesion: 0.12
Nodes (4): Annotation, getRgbColor(), LinkAnnotation, PopupAnnotation

### Community 50 - "CFFParser"
Cohesion: 0.11
Nodes (6): CFFCharset, CFFEncoding, CFFFDSelect, CFFHeader, CFFParser, parseOperand()

### Community 51 - "WorkerTransport"
Cohesion: 0.08
Nodes (3): isRefProxy(), Metadata, WorkerTransport

### Community 52 - ".restore"
Cohesion: 0.21
Nodes (3): copyCtxState(), getCurrentTransformInverse(), info()

### Community 53 - "unreachable"
Cohesion: 0.11
Nodes (6): BaseStream, bytesToString(), getFontFileType(), isTrueTypeCollectionFile(), Pattern, unreachable()

### Community 54 - "Parser"
Cohesion: 0.16
Nodes (4): Cmd, FlateStream, isWhiteSpace(), Parser

### Community 55 - ".constructor"
Cohesion: 0.14
Nodes (7): decrypt(), findBlock(), isHexDigit(), isSpecial(), Type1CharString, Type1Font, Type1Parser

### Community 56 - "PopupElement"
Cohesion: 0.10
Nodes (4): PDFDateString, PopupElement, XfaLayer, XfaText

### Community 58 - "PDFNetworkStreamFullRequestReader"
Cohesion: 0.08
Nodes (4): getArrayBuffer(), NetworkManager, PDFNetworkStream, PDFNetworkStreamFullRequestReader

### Community 59 - "PDFWorker"
Cohesion: 0.10
Nodes (6): getDocument(), LoopbackPort, m, PDFDocumentLoadingTask, PDFWorker, setVerbosityLevel()

### Community 60 - "ExclGroup"
Cohesion: 0.08
Nodes (7): Caption, Draw, ExclGroup, Field, Image, _setValue(), Value

### Community 61 - "readBit"
Cohesion: 0.14
Nodes (19): buildComponentData(), readBits(), decodeScan(), decodeBlock(), decodeHuffman(), decodeMcu(), readBit(), receive() (+11 more)

### Community 64 - "extractFilenameFromHeader"
Cohesion: 0.13
Nodes (11): createFetchOptions(), createResponseStatusError(), extractFilenameFromHeader(), fixupEncoding(), rfc2047decode(), rfc5987decode(), textdecode(), getResponseOrigin() (+3 more)

### Community 65 - ".constructor"
Cohesion: 0.17
Nodes (5): BaseShading, DummyShading, getB(), MeshShading, MeshStreamReader

### Community 66 - "FormatError"
Cohesion: 0.18
Nodes (4): FormatError, PDFFunction, PostScriptParser, toNumberArray()

### Community 68 - ".getPattern"
Cohesion: 0.12
Nodes (8): applyBoundingBox(), BaseShadingPattern, CachedCanvases, drawFigure(), drawTriangle(), DummyShadingPattern, MeshShadingPattern, RadialAxialShadingPattern

### Community 69 - ".compileGlyph"
Cohesion: 0.11
Nodes (5): Commands, CompiledFont, lookupCmap(), Transform, TrueTypeCompiled

### Community 70 - ".add"
Cohesion: 0.13
Nodes (14): compileCharString(), bezierCurveTo(), lineTo(), moveTo(), compileGlyf(), lineTo(), moveTo(), quadraticCurveTo() (+6 more)

### Community 71 - "Glyph"
Cohesion: 0.11
Nodes (5): CompositeGlyph, getUint32(), GlyfTable, Glyph, GlyphHeader

### Community 73 - "AnnotationStorage"
Cohesion: 0.10
Nodes (3): AnnotationStorage, objectFromMap(), PrintAnnotationStorage

### Community 76 - "find"
Cohesion: 0.12
Nodes (7): find(), FontFinder, PageSet, selectFont(), setFontFamily(), stripQuotes(), template_Font

### Community 79 - ".fallbackToSystemFont"
Cohesion: 0.11
Nodes (9): applyStandardFontGlyphMap(), buildToFontChar(), Fi, getUnicodeForGlyph(), ji, recoverGlyphName(), ToUnicodeMap, Xi (+1 more)

### Community 82 - "info"
Cohesion: 0.29
Nodes (3): CalGrayCS, CCITTFaxDecoder, info()

### Community 83 - "SimpleDOMNode"
Cohesion: 0.14
Nodes (3): DatasetXMLParser, SimpleDOMNode, SimpleXMLParser

### Community 85 - "getCurrentTransform"
Cohesion: 0.18
Nodes (3): getCurrentTransform(), resetCtxToDefault(), TilingPattern

### Community 86 - "manifest.json"
Cohesion: 0.12
Nodes (16): action, default_title, background, service_worker, commands, _execute_action, description, description (+8 more)

### Community 87 - "Subform"
Cohesion: 0.13
Nodes (5): addHTML(), createLine(), flushHTML(), getAvailableSpace(), Subform

### Community 88 - "ColorSpace"
Cohesion: 0.14
Nodes (3): AlternateCS, ColorSpace, PatternCS

### Community 90 - "setupDoc"
Cohesion: 0.20
Nodes (8): ensureNotTerminated(), loadDocument(), setupDoc(), onFailure(), onSuccess(), pdfManagerReady(), startWorkerTask(), WorkerTask

### Community 93 - "ColorConverters"
Cohesion: 0.18
Nodes (3): ColorConverters, makeColorComp(), scaleAndClamp()

### Community 98 - "Area"
Cohesion: 0.14
Nodes (3): Area, getContainedChildren(), SubformSet

### Community 102 - "Stream"
Cohesion: 0.14
Nodes (3): FontRendererFactory, parseCff(), Stream

### Community 103 - "fill-utils.js"
Cohesion: 0.36
Nodes (10): answerQuestions(), click(), fill(), flag(), key(), labelOf(), pickOption(), pickPrompt() (+2 more)

### Community 106 - "Builder"
Cohesion: 0.22
Nodes (3): Builder, Empty, UnknownNamespace

### Community 107 - "XhtmlObject"
Cohesion: 0.15
Nodes (4): _i, li, Sup, XhtmlObject

### Community 109 - "XhtmlNamespace"
Cohesion: 0.15
Nodes (4): Ol, Span, Ul, XhtmlNamespace

### Community 111 - "workday.js"
Cohesion: 0.36
Nodes (11): addEntry(), clearSection(), fillEdu(), fillExperience(), fillInfo(), fillJob(), fillSelf(), main() (+3 more)

### Community 117 - "HuffmanTable"
Cohesion: 0.20
Nodes (4): getStandardTable(), HuffmanLine, HuffmanTable, HuffmanTreeNode

### Community 121 - "PDFFetchStream"
Cohesion: 0.18
Nodes (3): createHeaders(), PDFFetchStream, PDFFetchStreamRangeReader

### Community 122 - "CFFDict"
Cohesion: 0.22
Nodes (3): CFFDict, CFFPrivateDict, CFFTopDict

### Community 127 - "Datasets"
Cohesion: 0.20
Nodes (3): Datasets, datasets_Data, DatasetsNamespace

### Community 137 - "Button"
Cohesion: 0.25
Nodes (4): a, Button, fixURL(), recoverJsURL()

### Community 171 - "Job Application Autofill (Edge / Chrome extension)"
Cohesion: 0.40
Nodes (4): Develop, Install, Job Application Autofill (Edge / Chrome extension), Use

## Knowledge Gaps
- **101 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AnnotationEditorUIManager` connect `AnnotationEditorUIManager` to `.delete`, `.highlightSelection`, `pdf.min.mjs`, `ImageManager`, `ColorPicker`, `.#_t`, `DrawingEditor`, `shadow`, `.setEditingState`, `AnnotationEditorLayer`, `HighlightEditor`, `.paste`, `FreeTextEditor`, `.fixAndSetPosition`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `pdf.worker.min.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.012308549150654415 - nodes in this community are weakly interconnected._
- **Why does `AnnotationEditor` connect `AnnotationEditor` to `AltText`, `.add`, `ImageManager`, `pdf.min.mjs`, `ColorPicker`, `DrawingEditor`, `HighlightEditor`, `shadow`, `.restore`, `warn`, `StampEditor`, `.remove`, `DrawingOptions`, `.#$e`, `FreeTextEditor`, `.fixAndSetPosition`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `.get` be split into smaller, more focused modules?**
  _Cohesion score 0.042590178183398525 - nodes in this community are weakly interconnected._
- **Why does `XFAObject` connect `XFAObject` to `pdf.worker.min.mjs`, `XFAAttribute`, `ConfigNamespace`, `Color`, `.get`, `XFAObjectArray`, `TemplateNamespace`, `Button`, `.push`, `LocaleSetNamespace`, `.success`, `PDFImage`, `PageArea`, `ContentObject`, `xdp_Xdp`, `.checkAndRepair`, `Root`, `signature_Signature`, `Stylesheet`, `Template`, `Traverse`, `ConnectionSetNamespace`, `Border`, `ImageEdit`, `Linear`, `Occur`, `Overflow`, `Encryption`, `EncryptionMethods`, `Reasons`, `ExclGroup`, `.compileGlyph`, `.add`, `find`, `Subform`, `Area`, `XmlObject`, `Builder`, `Datasets`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `ConfigNamespace` be split into smaller, more focused modules?**
  _Cohesion score 0.018691588785046728 - nodes in this community are weakly interconnected._
- **Should `OptionObject` be split into smaller, more focused modules?**
  _Cohesion score 0.019417475728155338 - nodes in this community are weakly interconnected._