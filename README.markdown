
# restify-git-json

An API to git repos exposed as a RESTful interface.

Uses libraries to package up
[js-git](https://github.com/creationix/js-git) as a set of streaming
interfaces.  Uses git streams to provide a
[RESTful API ala github](http://developer.github.com/v3/git/blobs/) 
to inspect, create, and manipulate git repos.

Includes an endpoint to upload files, streaming them into a uniquely
identified git reference.

## Example
EG
```bash
$ curl -vs -XPOST -H "content-type: multipart/form-data" -F file=@lib/stream-git.js localhost:6776/repo/test | json
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> POST /repo/test HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> Content-Length: 3684
> Expect: 100-continue
> content-type: multipart/form-data; boundary=----------------------------e64fd18f9418
>
< HTTP/1.1 100 Continue
} [data not shown]
< HTTP/1.1 201 Created
< Connection: close
< Content-Type: application/json
< Content-Length: 263
< Date: Tue, 17 Dec 2013 17:08:08 GMT
<
{ [data not shown]
* Closing connection #0
{ 
  "err": null,
  "body": [
    { 
      "commit": "9c39dc7b8d387e4288212edadef0b0a4dc61e02c",
      "tree": {
        "tree": "e1c959726677cf28d30f8d7e898271fc37d16b93",
        "author": {
          "name": "MY AUTHOR",
          "email": "git@js"
        },
        "committer": {
          "name": "MY COMMITTER",
          "email": "git@js"
        },
        "message": "MY JUSTIFICATION"  
      }
    }
  ]
}

```
So each request like this creates a new set of blobs on a new uniquely
identified branch.

**Work in progress.**

## Install
```bash
$ npm install
```

## Inspired by

* https://github.com/creationix/js-git/blob/master/examples/create.js
* https://gist.github.com/bewest/8008603
* https://github.com/substack/stream-handbook#transform
* https://github.com/dominictarr/event-stream#eventstream

## TODO

Many to most things, sorry.
#### high level
* get json api working
  * compat with github
* test with memdb
  * develop module for memcache/redis
  * develop module for s3 (knox, request, use proxy to s3)
* test git http support XXX: so far I have only tested using file
  based git bare repo... would prefer http support for mem and s3
  modules
* develop export module
  * bundle with encrypt?
* develop import module
* develop remotes/push module

#### low level
* make options for lots of things so that user can tweak stream
  behavior
  * committer, refs, etc


```bash
$ ( set -x; du -h -c out/test.git/ && git ls-remote out/test.git/ ) 2>&1 | tee -a README.markdown 
+ du -h -c out/test.git/
8.0K	out/test.git/objects/8a
8.0K	out/test.git/objects/93
8.0K	out/test.git/objects/98
8.0K	out/test.git/objects/5f
8.0K	out/test.git/objects/48
8.0K	out/test.git/objects/ab
8.0K	out/test.git/objects/e8
8.0K	out/test.git/objects/64
8.0K	out/test.git/objects/4b
8.0K	out/test.git/objects/60
8.0K	out/test.git/objects/2c
8.0K	out/test.git/objects/d3
8.0K	out/test.git/objects/ee
12K	out/test.git/objects/2f
8.0K	out/test.git/objects/47
8.0K	out/test.git/objects/95
8.0K	out/test.git/objects/87
8.0K	out/test.git/objects/12
12K	out/test.git/objects/1c
8.0K	out/test.git/objects/9c
8.0K	out/test.git/objects/d4
8.0K	out/test.git/objects/e1
8.0K	out/test.git/objects/cf
8.0K	out/test.git/objects/7a
8.0K	out/test.git/objects/d5
8.0K	out/test.git/objects/8e
8.0K	out/test.git/objects/91
8.0K	out/test.git/objects/ba
8.0K	out/test.git/objects/97
8.0K	out/test.git/objects/c9
252K	out/test.git/objects
60K	out/test.git/refs/heads/incoming/upload
68K	out/test.git/refs/heads/incoming
76K	out/test.git/refs/heads
80K	out/test.git/refs
340K	out/test.git/
340K	total
+ git ls-remote out/test.git/
ba60d078fdc05d2ebfa0b2deee7809c50347cd59	refs/heads/incoming/ba60d0
124d4ea0036615edf5f9fb71907b641cb9f1caef	refs/heads/incoming/upload/124d4e
1c4ea460cda81ebac5b2ef8c4a157073b11b8ca0	refs/heads/incoming/upload/1c4ea4
1cbf4301951821dbfc74d073264d1e4571711d56	refs/heads/incoming/upload/1cbf43
477e9df3171918545fca332a71413e1923743e75	refs/heads/incoming/upload/477e9d
87c203ef63bf5704f39c6feb3e8b4d82e5957a83	refs/heads/incoming/upload/87c203
8a56e90c3e0d732e7981f1d9f6eb3c30d760d1fc	refs/heads/incoming/upload/8a56e9
91c110fa80d613e914b8bd9da884563f54c6ee1b	refs/heads/incoming/upload/91c110
93fb38e6ff926788002f49a5686d03035f7a4ab6	refs/heads/incoming/upload/93fb38
98512f36f8c35185521e2ba102c7a556877be6ce	refs/heads/incoming/upload/98512f
9c39dc7b8d387e4288212edadef0b0a4dc61e02c	refs/heads/incoming/upload/9c39dc
ab9850a41b549ff16fbbbc7605261de6d27cad26	refs/heads/incoming/upload/ab9850
d535615b6af634cc987fbfb364d56050971ae0e6	refs/heads/incoming/upload/d53561
e87ae9238e5971348415eeecd8fcfadb237f45b5	refs/heads/incoming/upload/e87ae9
ee73988fd244da7262f894a99ac9cd38204e5585	refs/heads/incoming/upload/ee7398
d31738be90a7e4d51960f4f8320e5d874cbe53db	refs/heads/master
```
