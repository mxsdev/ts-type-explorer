# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.4.0](https://github.com/mxsdev/ts-expand-type/compare/v0.3.3...v0.4.0) (2022-11-20)

### Bug Fixes

-   hide internal symbol names ([b9b49ff](https://github.com/mxsdev/ts-expand-type/commit/b9b49ff12cd4c3caf3529843bf7c43a4482b2e9a)), closes [#20](https://github.com/mxsdev/ts-expand-type/issues/20)

### Features

-   **api:** secure lazy symbol resolution ([a21086c](https://github.com/mxsdev/ts-expand-type/commit/a21086c66062d7b4e2a94d3162c9cbe71193323f)), closes [#23](https://github.com/mxsdev/ts-expand-type/issues/23)
-   configurable recursion depth ([99f6878](https://github.com/mxsdev/ts-expand-type/commit/99f68782b7e6b5c295338e4bbc3b0092cbe9c7ae))
-   error entries in type tree ([071665c](https://github.com/mxsdev/ts-expand-type/commit/071665c82bbeeb0fb08c4cc87c140a0d8c6ac046)), closes [#15](https://github.com/mxsdev/ts-expand-type/issues/15)
-   show type arguments in labels ([1c062c7](https://github.com/mxsdev/ts-expand-type/commit/1c062c78b4ac93d2faa2c7d35b56b340296c666f)), closes [#19](https://github.com/mxsdev/ts-expand-type/issues/19)
-   **vscode:** max depth tooltip ([0c34a24](https://github.com/mxsdev/ts-expand-type/commit/0c34a245fd4db8c1a5f92b55ca6bca2170fe34c4)), closes [#26](https://github.com/mxsdev/ts-expand-type/issues/26)

## [0.3.3](https://github.com/mxsdev/ts-expand-type/compare/v0.3.2...v0.3.3) (2022-11-09)

### Bug Fixes

-   **vscode:** log localization errors ([e5bc685](https://github.com/mxsdev/ts-expand-type/commit/e5bc68521a314dd09f84238046add02958f48366))

## [0.3.2](https://github.com/mxsdev/ts-expand-type/compare/v0.3.1...v0.3.2) (2022-11-09)

### Bug Fixes

-   **api:** remove typescript import ([acfe537](https://github.com/mxsdev/ts-expand-type/commit/acfe5371483dc3a8ead50875c14aab65b353abba))

## [0.3.1](https://github.com/mxsdev/ts-expand-type/compare/v0.3.0...v0.3.1) (2022-11-09)

### Bug Fixes

-   **api:** resolve signature only on identifier ([155fbff](https://github.com/mxsdev/ts-expand-type/commit/155fbfffada7e30495b3f01d8bbf4cf33af17209))
-   **api:** resolve symbol declarations ([4d6640f](https://github.com/mxsdev/ts-expand-type/commit/4d6640f76d2c38bd3f92687297032ce7632e220f)), closes [#16](https://github.com/mxsdev/ts-expand-type/issues/16)
-   vscode test command not running ([701714b](https://github.com/mxsdev/ts-expand-type/commit/701714bc3f6fc6b9b7417f278e0ea00afa147b27))

### Features

-   **vscode:** add logo, improve docs ([ef11564](https://github.com/mxsdev/ts-expand-type/commit/ef1156484bb669b4781a3520ebfb7a30b6c1cc19))

# [0.3.0](https://github.com/mxsdev/ts-expand-type/compare/v0.2.0...v0.3.0) (2022-11-08)

### Bug Fixes

-   **api:** error getting signature type arguments ([732fe0d](https://github.com/mxsdev/ts-expand-type/commit/732fe0dc034c834aaf495aee04ec286786a54275)), closes [#14](https://github.com/mxsdev/ts-expand-type/issues/14)
-   **api:** find nearest signature recursively ([ec3b53b](https://github.com/mxsdev/ts-expand-type/commit/ec3b53bf83abe3d175ac1c44a1b14e2396eb37d7)), closes [#9](https://github.com/mxsdev/ts-expand-type/issues/9)
-   **api:** getParameterInfo throws error ([3d0dd77](https://github.com/mxsdev/ts-expand-type/commit/3d0dd77bd587a596c741908bbc4f1dc8ccec8ffa))
-   **api:** import ts as pure type ([404a009](https://github.com/mxsdev/ts-expand-type/commit/404a0096d582b90ae8ec6de18e9c918e2a394482))
-   **api:** max recursion depth hit unexpectedly ([b97d4de](https://github.com/mxsdev/ts-expand-type/commit/b97d4deea9a68fbc97fc80f4af47965ecbf0ce44)), closes [#10](https://github.com/mxsdev/ts-expand-type/issues/10)
-   **api:** use interface symbol as alias ([4a38b19](https://github.com/mxsdev/ts-expand-type/commit/4a38b19ab86f6f47216c3381b7b25ec7286fb10a))

### Features

-   **api:** use resolved symbol as alias ([db02e7b](https://github.com/mxsdev/ts-expand-type/commit/db02e7ba7e1ad72eb79b6d41a5a5c5ca014b21b9))
-   support modules and namespaces ([670e069](https://github.com/mxsdev/ts-expand-type/commit/670e06970baf7040471aa5967a974a0d521f415a)), closes [#6](https://github.com/mxsdev/ts-expand-type/issues/6) [#7](https://github.com/mxsdev/ts-expand-type/issues/7)
-   support readonly ([5848029](https://github.com/mxsdev/ts-expand-type/commit/5848029cfbe116727efa9ed28cc728ebb6dac544))
-   **vscode:** hide error messages ([1103cc0](https://github.com/mxsdev/ts-expand-type/commit/1103cc0604dd05588cd17b3b46a8744aa6554477)), closes [#13](https://github.com/mxsdev/ts-expand-type/issues/13)

# [0.2.0](https://github.com/mxsdev/ts-expand-type/compare/v0.1.0...v0.2.0) (2022-10-30)

### Bug Fixes

-   **api:** type node resolution sometimes failing ([c9873f8](https://github.com/mxsdev/ts-expand-type/commit/c9873f8368dea2fc715fd78ee7cda9bda892b214))
-   return dummy completion info ([544bdc1](https://github.com/mxsdev/ts-expand-type/commit/544bdc149b7d4e7d5f44048749ebf3ce834c829b))
-   **tsserver:** reference types ([b0ee19a](https://github.com/mxsdev/ts-expand-type/commit/b0ee19a4de53449c559aadd9717f41ee7392f7a5))
-   **vscode:** markdown links throws error ([68544be](https://github.com/mxsdev/ts-expand-type/commit/68544be6401ea6d06fca53a785672543276c9068))

### Features

-   support jsx components ([65e3c87](https://github.com/mxsdev/ts-expand-type/commit/65e3c87d2f6b8017265bd455265056b06bb0e1db))
-   **vscode:** enable type tree in jsx contexts ([3538e64](https://github.com/mxsdev/ts-expand-type/commit/3538e64b3676abff27c388ff89e4b80bb703cb3d))

### Performance Improvements

-   switch from quickinfo to completions ([0d18d5c](https://github.com/mxsdev/ts-expand-type/commit/0d18d5cd4538d04c94a94da7452754f695cfacf9))
-   **vscode:** strip unneeded test files ([37d10a7](https://github.com/mxsdev/ts-expand-type/commit/37d10a76e615ef4743acbecc62341958e78fc7be))

# 0.1.0 (2022-10-28)

### Bug Fixes

-   **api:** check for optional parameters ([6aa937e](https://github.com/mxsdev/ts-expand-type/commit/6aa937eeea972729303e95bc5b3ffcd63cab3f81))
-   **api:** fix stripped internals ([2aa4761](https://github.com/mxsdev/ts-expand-type/commit/2aa4761af5950393115cb14ef3445291173d6436))
-   **api:** ignore instantiated mapped type parameters ([9cdaeca](https://github.com/mxsdev/ts-expand-type/commit/9cdaeca85c7cb6b618de74d1e54bfe37e84e01cf))
-   **api:** implement max recursion depth ([10c621e](https://github.com/mxsdev/ts-expand-type/commit/10c621e5af85e65716524822b621ee48c728d6af))
-   **api:** include class implementations ([955abcd](https://github.com/mxsdev/ts-expand-type/commit/955abcd270a9af22c25d832de60fe4289b8a4fc9))
-   **api:** interface doesn't have alias ([6857141](https://github.com/mxsdev/ts-expand-type/commit/6857141eac4062088e31593906bd8e7a683d40e2))
-   **api:** intersections not merging ([48bd533](https://github.com/mxsdev/ts-expand-type/commit/48bd5336cc69d7310032deab13bd9a58604130b0))
-   **api:** narrow declarations to identifier ([5b8448f](https://github.com/mxsdev/ts-expand-type/commit/5b8448f4f3afdf7b827fbdf833d446040731fa3a))
-   **api:** not getting interface symbols ([8646664](https://github.com/mxsdev/ts-expand-type/commit/8646664b0b7f5217e3659b3e8b33470bdce4dcb7))
-   **api:** simple index info has parameter info ([3b477b5](https://github.com/mxsdev/ts-expand-type/commit/3b477b587d1342f2fe79f5d3061b37fb879bf249))
-   **api:** some enum literals not working ([d507076](https://github.com/mxsdev/ts-expand-type/commit/d507076adcbcfe414818e8a46dbb736bbfe3907e))
-   **api:** support intersections of mapped types ([799f81c](https://github.com/mxsdev/ts-expand-type/commit/799f81c2883464a231aacb9841215a01e83ca5b2))
-   **api:** support synthetic anonymous types ([6fcfe62](https://github.com/mxsdev/ts-expand-type/commit/6fcfe62c358f81969efa44c6889323a8bbc18266))
-   class instances shouldn't go to class definitions ([b5340f9](https://github.com/mxsdev/ts-expand-type/commit/b5340f9247392fdef65d143ced9b116e4b776b8a))
-   force type alias resolution ([293b3bb](https://github.com/mxsdev/ts-expand-type/commit/293b3bb8f7df0dc5eddf08dc936cbd3dd041467c))
-   mapped type/signatures dont have icons ([1f16913](https://github.com/mxsdev/ts-expand-type/commit/1f169138911c83b8c3e4cf604a22fb48ab1ef247))
-   prevent race condition with refresh ([421a9f9](https://github.com/mxsdev/ts-expand-type/commit/421a9f962f610fe7ba8fd0d3eeb63e939248bd14))
-   **vscode:** getQuickInfo error on startup ([edda36a](https://github.com/mxsdev/ts-expand-type/commit/edda36a0e06d1900d3b490dc23240237355c6b39))
-   **vscode:** proper icon for boolean literals ([1d3a021](https://github.com/mxsdev/ts-expand-type/commit/1d3a0214192c94060e07187aba8ac6dba254a242))
-   **vscode:** remove debug logging ([ad3113d](https://github.com/mxsdev/ts-expand-type/commit/ad3113d8bac5656f468d33f47b3813080330ca8f))
-   **vscode:** support only ts files ([e0c9541](https://github.com/mxsdev/ts-expand-type/commit/e0c9541799317dfb33d16a8fa16a5c3fbe1b06c9))

### Features

-   add config options ([d5f8b76](https://github.com/mxsdev/ts-expand-type/commit/d5f8b7639a7dc468d32775230a59c0733c1c14f2))
-   add prefix to type information ([8d9e0a6](https://github.com/mxsdev/ts-expand-type/commit/8d9e0a62ececb9518be0c0ed478e9b9feac70cb5))
-   add type parameter constraint and default ([79b7634](https://github.com/mxsdev/ts-expand-type/commit/79b763450972d9f38dc7c8262e70386fd513ebc3))
-   allow multiline printing ([cd3c164](https://github.com/mxsdev/ts-expand-type/commit/cd3c164bcecb282a971802b5f90ac88787ac5739))
-   **api:** add location to index info ([d064c55](https://github.com/mxsdev/ts-expand-type/commit/d064c553484437b66d989ccca246da7fa67a1a25))
-   **api:** add primitive kind to localized tree ([2613e19](https://github.com/mxsdev/ts-expand-type/commit/2613e191a8b6d97c45041bfc5ddd036905f5dd67))
-   **api:** export tree info types ([943b3eb](https://github.com/mxsdev/ts-expand-type/commit/943b3ebb6ec2f5b34db0a273389b7a43cb9bec32))
-   **api:** generate type tree ([81b89f2](https://github.com/mxsdev/ts-expand-type/commit/81b89f2f4acf0bfe557d2c0423f9200f9d833546))
-   **api:** give purpose as string literal ([32cb5f7](https://github.com/mxsdev/ts-expand-type/commit/32cb5f79dcbce37ced4766a1d252b5c856b0be38))
-   **api:** indicate properties in localized tree ([349cc3b](https://github.com/mxsdev/ts-expand-type/commit/349cc3b071dde70bcc3660ae146d46658fa8a517))
-   **api:** support boolean literals ([190a996](https://github.com/mxsdev/ts-expand-type/commit/190a9962aef42b71fa694e40e597acc873a06523))
-   **api:** support conditional types ([180a0a9](https://github.com/mxsdev/ts-expand-type/commit/180a0a9b71de0b7a5e2bd67a06505ea96e277d12))
-   **api:** support mapped type parameters ([d0c603a](https://github.com/mxsdev/ts-expand-type/commit/d0c603a2075adfe65033bd16a67133640eec8352))
-   **api:** support optional parameters ([7dfbeb8](https://github.com/mxsdev/ts-expand-type/commit/7dfbeb86c7e38b86211d4bd12c72fdefda718d03))
-   code extension scaffolding ([8e011f8](https://github.com/mxsdev/ts-expand-type/commit/8e011f808ad2d8e7e71fa874664e0c8a5eb88b72))
-   exclude original quickinfo by default ([3d7eb09](https://github.com/mxsdev/ts-expand-type/commit/3d7eb09a74a0d70ca4cc16f558b282a6798fac4f))
-   explorer view navigation button order ([556d85e](https://github.com/mxsdev/ts-expand-type/commit/556d85ea13262b82158e52cb1d04fbf27cda0c50))
-   include class info within class instance ([d19130c](https://github.com/mxsdev/ts-expand-type/commit/d19130cd865f9214b2737353c50c36adc71c8ad4))
-   lazy load symbols ([f078045](https://github.com/mxsdev/ts-expand-type/commit/f0780452a722da283a2bce8107e79fe23b4dc1fd))
-   mapped type parameters ([7688059](https://github.com/mxsdev/ts-expand-type/commit/76880597ac5ad4fd1f1d60cfb239d8d29f942616))
-   new logo design ([8c7617f](https://github.com/mxsdev/ts-expand-type/commit/8c7617f5b40453b77f41ee03740bacc2dc45976c))
-   remove expanded hover ([fdbe26c](https://github.com/mxsdev/ts-expand-type/commit/fdbe26c4a10d39e6ad83bf4926830e8cec23dc32))
-   remove tsserver-plugin ([2cd0c08](https://github.com/mxsdev/ts-expand-type/commit/2cd0c08a39e9328842df44fa3496ea77698cc1a2))
-   show type info for type literals ([770dfba](https://github.com/mxsdev/ts-expand-type/commit/770dfba77aa8265927785aac7e8e76006eee7303))
-   support alias names ([1174b6d](https://github.com/mxsdev/ts-expand-type/commit/1174b6dba6579dc4606b06054763bd8f3c2c4a32))
-   support arrays and tuples ([2429fda](https://github.com/mxsdev/ts-expand-type/commit/2429fdac148a5c8c32843fd19a214c283d952e35))
-   support classes & interfaces ([34f1340](https://github.com/mxsdev/ts-expand-type/commit/34f134059680c956b6051bfc05fa71f0db0b2fb7))
-   support enums & enum literals ([01c0749](https://github.com/mxsdev/ts-expand-type/commit/01c074979abd3870bcb0e47c987a0fac26211439))
-   support function generics ([9eecac9](https://github.com/mxsdev/ts-expand-type/commit/9eecac908c20e514dfab1b98b26111649872026c))
-   support going to type definition ([e4b6675](https://github.com/mxsdev/ts-expand-type/commit/e4b66757d7157cd485876b43fca382007c4406e7))
-   support indexes in interfaces ([0f99fe8](https://github.com/mxsdev/ts-expand-type/commit/0f99fe8cad5a5843483b4b402383284833bb6809))
-   support intrinsic types ([802e9f5](https://github.com/mxsdev/ts-expand-type/commit/802e9f512139c8c0859c9293aecabf40ac8a7fd4))
-   support keyof and indexed access ([5e67899](https://github.com/mxsdev/ts-expand-type/commit/5e6789924cd2d0184e3462645a3fe3ff3a6fd0d0))
-   support mapped types ([ee508e5](https://github.com/mxsdev/ts-expand-type/commit/ee508e5afe96e08dc04aec4dbd550cbc4e4a7173))
-   support named tuples ([f87a0ab](https://github.com/mxsdev/ts-expand-type/commit/f87a0ab285609ab56f81fd5696a2fa4b8e012bad))
-   support optional function parameters ([0a7704c](https://github.com/mxsdev/ts-expand-type/commit/0a7704ccb882ed35e596b4221d22373a44b5fe9b))
-   support rest parameters ([ebb5ddb](https://github.com/mxsdev/ts-expand-type/commit/ebb5ddba158f797dc73e171eef92141cbfe19e78))
-   support type parameters in classes and type aliases ([be63c2e](https://github.com/mxsdev/ts-expand-type/commit/be63c2e01439c77c6e682618288d456e7aeea1ef))
-   **vscode:** add config for icons/icon colors ([e80765f](https://github.com/mxsdev/ts-expand-type/commit/e80765fcd0735e0f84aafd993fbde03835d70257))
-   **vscode:** add icons ([4ed638a](https://github.com/mxsdev/ts-expand-type/commit/4ed638ac0b4684253ce0ff9967d243303b9c30a2))
-   **vscode:** add search button ([ef5a9e4](https://github.com/mxsdev/ts-expand-type/commit/ef5a9e4ba83ab428c9d0d4c0f97ce3ac974de5da))
-   **vscode:** add selection lock ([c1f34ff](https://github.com/mxsdev/ts-expand-type/commit/c1f34ff9f1f1c4a3668966d6fcfa640c2312f242))
-   **vscode:** add type tree view ([9d18f22](https://github.com/mxsdev/ts-expand-type/commit/9d18f220404cf68259ac34226eef0ad5a5c4627c))
-   **vscode:** allow disablling selection on click ([c385e69](https://github.com/mxsdev/ts-expand-type/commit/c385e69bd775017b52b302dadc8de405d98b9c47))
-   **vscode:** auto-unfold type tree root ([0e3cab9](https://github.com/mxsdev/ts-expand-type/commit/0e3cab9b1eb08942ac42d7a3b2fe85f7a280b264))
-   **vscode:** change view container icon ([f77206c](https://github.com/mxsdev/ts-expand-type/commit/f77206c4ae2f8adf9b17f9688406bfe5d2b76f66))
-   **vscode:** conditional types ([ad3cf2e](https://github.com/mxsdev/ts-expand-type/commit/ad3cf2e34e55c12dedb3b230e08efff72d83a820))
-   **vscode:** config for parameter, base class ([ce78ef7](https://github.com/mxsdev/ts-expand-type/commit/ce78ef7e78b60f23037b13c19464a0d4dada3011))
-   **vscode:** config for type parameter info ([456bb7b](https://github.com/mxsdev/ts-expand-type/commit/456bb7bd186aadb523019f724ac8919d1cb06ab5))
-   **vscode:** cycle through definitions ([97b5218](https://github.com/mxsdev/ts-expand-type/commit/97b521898a8bbceec624d3c60526dd155e67c9b2))
-   **vscode:** expanded type in quickinfo ([ceaafa9](https://github.com/mxsdev/ts-expand-type/commit/ceaafa9b04efe208e0ad9a2ff5c47d0d17a60847))
-   **vscode:** go to definition button ([2564263](https://github.com/mxsdev/ts-expand-type/commit/2564263ed34123cac39ea203a69593c524bc82dd))
-   **vscode:** jsdoc support ([83edc7f](https://github.com/mxsdev/ts-expand-type/commit/83edc7f120d244f6b1f667d2ad6f80e1747a581c))
-   **vscode:** manual selection ([ac72e65](https://github.com/mxsdev/ts-expand-type/commit/ac72e65150d49c11f4f04d1946e9205a4521f459))
-   **vscode:** refresh view on config change ([6279ec6](https://github.com/mxsdev/ts-expand-type/commit/6279ec601da481fc2d52adac3e4076bb77c5cb9b))
-   **vscode:** select type on open ([c50fd2c](https://github.com/mxsdev/ts-expand-type/commit/c50fd2c540c73c8e4e3f8e04cf28d8b1a935f7e5))
-   **vscode:** support bigint literals ([8353913](https://github.com/mxsdev/ts-expand-type/commit/8353913670425608351b2a8110bdfa83c284cbdb))
-   **vscode:** support mapped types ([56942d9](https://github.com/mxsdev/ts-expand-type/commit/56942d927cbf86d3b54aa175f65add9afecdc4d3))
-   **vscode:** support partials in tree view ([2314e57](https://github.com/mxsdev/ts-expand-type/commit/2314e57583c26e60485d6535ec0c1776b2a80efa))
-   **vscode:** support template literal types ([36b4edf](https://github.com/mxsdev/ts-expand-type/commit/36b4edf24b761b59734029d9f1232d489e0c8e1a))
-   **vscode:** support type parameters ([d450000](https://github.com/mxsdev/ts-expand-type/commit/d450000afed19498eb4c1882529e67cfc43eee28))
-   **vscode:** update config smartly ([c1ed290](https://github.com/mxsdev/ts-expand-type/commit/c1ed290b71b977e36be2c7266d9486c4b44a64f8))
