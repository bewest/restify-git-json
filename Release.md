
v0.0.6 / 2014-01-25
==================

Variety of fixes and tweaks.
Managed to revisit url generation.
The server will detect the header `hakken-service` and generate
hakken:// urls in the responses.
Urls now use nurlize to generate urls.

Logs are much cleaner and now use some kind of logging system (based
on bunyan), instead of console.log.

 * remove console clutter from test output
 * Add homepage and tweak git-fs-db version
 * fix mkir/mkdir typo
 * switch to using a log system
 * WIP this is how logging will look mostly
 * prepare logging a bit better
 * remove dead urlize code
 * update git-fs-db dependency version
 * try to debug travis failure better
 * add test/git/refs back into test
 * introduce nurlize, tweak tests
