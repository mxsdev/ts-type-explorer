# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.3](https://github.com/mxsdev/ts-type-explorer/compare/v0.3.2...v0.3.3) (2022-11-09)

### Bug Fixes

-   **vscode:** log localization errors ([e5bc685](https://github.com/mxsdev/ts-type-explorer/commit/e5bc68521a314dd09f84238046add02958f48366))

## [0.3.2](https://github.com/mxsdev/ts-type-explorer/compare/v0.3.1...v0.3.2) (2022-11-09)

-   Fix extension load failure due to typescript import

## [0.3.1](https://github.com/mxsdev/ts-type-explorer/compare/v0.3.0...v0.3.1) (2022-11-09)

### Features

-   **vscode:** add logo, improve docs ([ef11564](https://github.com/mxsdev/ts-type-explorer/commit/ef1156484bb669b4781a3520ebfb7a30b6c1cc19))

# [0.3.0](https://github.com/mxsdev/ts-type-explorer/compare/v0.2.0...v0.3.0) (2022-11-08)

### Features

-   support modules and namespaces ([670e069](https://github.com/mxsdev/ts-type-explorer/commit/670e06970baf7040471aa5967a974a0d521f415a)), closes [#6](https://github.com/mxsdev/ts-type-explorer/issues/6) [#7](https://github.com/mxsdev/ts-type-explorer/issues/7)
-   support readonly ([5848029](https://github.com/mxsdev/ts-type-explorer/commit/5848029cfbe116727efa9ed28cc728ebb6dac544))
-   **vscode:** hide error messages ([1103cc0](https://github.com/mxsdev/ts-type-explorer/commit/1103cc0604dd05588cd17b3b46a8744aa6554477)), closes [#13](https://github.com/mxsdev/ts-type-explorer/issues/13)

# [0.2.0](https://github.com/mxsdev/ts-type-explorer/compare/v0.1.0...v0.2.0) (2022-10-30)

### Bug Fixes

-   return dummy completion info ([544bdc1](https://github.com/mxsdev/ts-type-explorer/commit/544bdc149b7d4e7d5f44048749ebf3ce834c829b))
-   **vscode:** markdown links throws error ([68544be](https://github.com/mxsdev/ts-type-explorer/commit/68544be6401ea6d06fca53a785672543276c9068))

### Features

-   support jsx components ([65e3c87](https://github.com/mxsdev/ts-type-explorer/commit/65e3c87d2f6b8017265bd455265056b06bb0e1db))
-   **vscode:** enable type tree in jsx contexts ([3538e64](https://github.com/mxsdev/ts-type-explorer/commit/3538e64b3676abff27c388ff89e4b80bb703cb3d))

### Performance Improvements

-   switch from quickinfo to completions ([0d18d5c](https://github.com/mxsdev/ts-type-explorer/commit/0d18d5cd4538d04c94a94da7452754f695cfacf9))
-   **vscode:** strip unneeded test files ([37d10a7](https://github.com/mxsdev/ts-type-explorer/commit/37d10a76e615ef4743acbecc62341958e78fc7be))

# 0.1.0 (2022-10-28)

### Bug Fixes

-   **api:** implement max recursion depth ([10c621e](https://github.com/mxsdev/ts-type-explorer/commit/10c621e5af85e65716524822b621ee48c728d6af))
-   **api:** support synthetic anonymous types ([6fcfe62](https://github.com/mxsdev/ts-type-explorer/commit/6fcfe62c358f81969efa44c6889323a8bbc18266))
-   mapped type/signatures dont have icons ([1f16913](https://github.com/mxsdev/ts-type-explorer/commit/1f169138911c83b8c3e4cf604a22fb48ab1ef247))
-   prevent race condition with refresh ([421a9f9](https://github.com/mxsdev/ts-type-explorer/commit/421a9f962f610fe7ba8fd0d3eeb63e939248bd14))
-   **vscode:** getQuickInfo error on startup ([edda36a](https://github.com/mxsdev/ts-type-explorer/commit/edda36a0e06d1900d3b490dc23240237355c6b39))
-   **vscode:** proper icon for boolean literals ([1d3a021](https://github.com/mxsdev/ts-type-explorer/commit/1d3a0214192c94060e07187aba8ac6dba254a242))
-   **vscode:** remove debug logging ([ad3113d](https://github.com/mxsdev/ts-type-explorer/commit/ad3113d8bac5656f468d33f47b3813080330ca8f))
-   **vscode:** support only ts files ([e0c9541](https://github.com/mxsdev/ts-type-explorer/commit/e0c9541799317dfb33d16a8fa16a5c3fbe1b06c9))

### Features

-   add type parameter constraint and default ([79b7634](https://github.com/mxsdev/ts-type-explorer/commit/79b763450972d9f38dc7c8262e70386fd513ebc3))
-   **api:** give purpose as string literal ([32cb5f7](https://github.com/mxsdev/ts-type-explorer/commit/32cb5f79dcbce37ced4766a1d252b5c856b0be38))
-   code extension scaffolding ([8e011f8](https://github.com/mxsdev/ts-type-explorer/commit/8e011f808ad2d8e7e71fa874664e0c8a5eb88b72))
-   explorer view navigation button order ([556d85e](https://github.com/mxsdev/ts-type-explorer/commit/556d85ea13262b82158e52cb1d04fbf27cda0c50))
-   lazy load symbols ([f078045](https://github.com/mxsdev/ts-type-explorer/commit/f0780452a722da283a2bce8107e79fe23b4dc1fd))
-   new logo design ([8c7617f](https://github.com/mxsdev/ts-type-explorer/commit/8c7617f5b40453b77f41ee03740bacc2dc45976c))
-   remove expanded hover ([fdbe26c](https://github.com/mxsdev/ts-type-explorer/commit/fdbe26c4a10d39e6ad83bf4926830e8cec23dc32))
-   support alias names ([1174b6d](https://github.com/mxsdev/ts-type-explorer/commit/1174b6dba6579dc4606b06054763bd8f3c2c4a32))
-   support arrays and tuples ([2429fda](https://github.com/mxsdev/ts-type-explorer/commit/2429fdac148a5c8c32843fd19a214c283d952e35))
-   support classes & interfaces ([34f1340](https://github.com/mxsdev/ts-type-explorer/commit/34f134059680c956b6051bfc05fa71f0db0b2fb7))
-   support enums & enum literals ([01c0749](https://github.com/mxsdev/ts-type-explorer/commit/01c074979abd3870bcb0e47c987a0fac26211439))
-   support going to type definition ([e4b6675](https://github.com/mxsdev/ts-type-explorer/commit/e4b66757d7157cd485876b43fca382007c4406e7))
-   support intrinsic types ([802e9f5](https://github.com/mxsdev/ts-type-explorer/commit/802e9f512139c8c0859c9293aecabf40ac8a7fd4))
-   support keyof and indexed access ([5e67899](https://github.com/mxsdev/ts-type-explorer/commit/5e6789924cd2d0184e3462645a3fe3ff3a6fd0d0))
-   support named tuples ([f87a0ab](https://github.com/mxsdev/ts-type-explorer/commit/f87a0ab285609ab56f81fd5696a2fa4b8e012bad))
-   support optional function parameters ([0a7704c](https://github.com/mxsdev/ts-type-explorer/commit/0a7704ccb882ed35e596b4221d22373a44b5fe9b))
-   support rest parameters ([ebb5ddb](https://github.com/mxsdev/ts-type-explorer/commit/ebb5ddba158f797dc73e171eef92141cbfe19e78))
-   **vscode:** add config for icons/icon colors ([e80765f](https://github.com/mxsdev/ts-type-explorer/commit/e80765fcd0735e0f84aafd993fbde03835d70257))
-   **vscode:** add icons ([4ed638a](https://github.com/mxsdev/ts-type-explorer/commit/4ed638ac0b4684253ce0ff9967d243303b9c30a2))
-   **vscode:** add search button ([ef5a9e4](https://github.com/mxsdev/ts-type-explorer/commit/ef5a9e4ba83ab428c9d0d4c0f97ce3ac974de5da))
-   **vscode:** add selection lock ([c1f34ff](https://github.com/mxsdev/ts-type-explorer/commit/c1f34ff9f1f1c4a3668966d6fcfa640c2312f242))
-   **vscode:** add type tree view ([9d18f22](https://github.com/mxsdev/ts-type-explorer/commit/9d18f220404cf68259ac34226eef0ad5a5c4627c))
-   **vscode:** allow disablling selection on click ([c385e69](https://github.com/mxsdev/ts-type-explorer/commit/c385e69bd775017b52b302dadc8de405d98b9c47))
-   **vscode:** auto-unfold type tree root ([0e3cab9](https://github.com/mxsdev/ts-type-explorer/commit/0e3cab9b1eb08942ac42d7a3b2fe85f7a280b264))
-   **vscode:** change view container icon ([f77206c](https://github.com/mxsdev/ts-type-explorer/commit/f77206c4ae2f8adf9b17f9688406bfe5d2b76f66))
-   **vscode:** conditional types ([ad3cf2e](https://github.com/mxsdev/ts-type-explorer/commit/ad3cf2e34e55c12dedb3b230e08efff72d83a820))
-   **vscode:** config for parameter, base class ([ce78ef7](https://github.com/mxsdev/ts-type-explorer/commit/ce78ef7e78b60f23037b13c19464a0d4dada3011))
-   **vscode:** config for type parameter info ([456bb7b](https://github.com/mxsdev/ts-type-explorer/commit/456bb7bd186aadb523019f724ac8919d1cb06ab5))
-   **vscode:** cycle through definitions ([97b5218](https://github.com/mxsdev/ts-type-explorer/commit/97b521898a8bbceec624d3c60526dd155e67c9b2))
-   **vscode:** expanded type in quickinfo ([ceaafa9](https://github.com/mxsdev/ts-type-explorer/commit/ceaafa9b04efe208e0ad9a2ff5c47d0d17a60847))
-   **vscode:** go to definition button ([2564263](https://github.com/mxsdev/ts-type-explorer/commit/2564263ed34123cac39ea203a69593c524bc82dd))
-   **vscode:** jsdoc support ([83edc7f](https://github.com/mxsdev/ts-type-explorer/commit/83edc7f120d244f6b1f667d2ad6f80e1747a581c))
-   **vscode:** manual selection ([ac72e65](https://github.com/mxsdev/ts-type-explorer/commit/ac72e65150d49c11f4f04d1946e9205a4521f459))
-   **vscode:** refresh view on config change ([6279ec6](https://github.com/mxsdev/ts-type-explorer/commit/6279ec601da481fc2d52adac3e4076bb77c5cb9b))
-   **vscode:** select type on open ([c50fd2c](https://github.com/mxsdev/ts-type-explorer/commit/c50fd2c540c73c8e4e3f8e04cf28d8b1a935f7e5))
-   **vscode:** support bigint literals ([8353913](https://github.com/mxsdev/ts-type-explorer/commit/8353913670425608351b2a8110bdfa83c284cbdb))
-   **vscode:** support mapped types ([56942d9](https://github.com/mxsdev/ts-type-explorer/commit/56942d927cbf86d3b54aa175f65add9afecdc4d3))
-   **vscode:** support partials in tree view ([2314e57](https://github.com/mxsdev/ts-type-explorer/commit/2314e57583c26e60485d6535ec0c1776b2a80efa))
-   **vscode:** support template literal types ([36b4edf](https://github.com/mxsdev/ts-type-explorer/commit/36b4edf24b761b59734029d9f1232d489e0c8e1a))
-   **vscode:** support type parameters ([d450000](https://github.com/mxsdev/ts-type-explorer/commit/d450000afed19498eb4c1882529e67cfc43eee28))
-   **vscode:** update config smartly ([c1ed290](https://github.com/mxsdev/ts-type-explorer/commit/c1ed290b71b977e36be2c7266d9486c4b44a64f8))
