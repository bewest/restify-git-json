
# restify-git-json

An API to git repos exposed as a RESTful interface.

Uses libraries to package up
[js-git](https://github.com/creationix/js-git) as a set of streaming
interfaces.  Uses git streams to provide a
[RESTful API ala github](http://developer.github.com/v3/git/blobs/) 
to inspect, create, and manipulate git repos.

Includes an endpoint to upload files, streaming them into a uniquely
identified git reference per user per namespace per upload.

## API

### HTTP REST Endpoints
Basic idea is to wrap a configurable git repo (backed by s3, memory,
or bare fs) using js-git, providing a RESTful API identical to the
[github json API](http://developer.github.com/v3/git/).

Basic pattern is:
```tsv
METHOD	ENDPOINT	Description
GET	/repos/:owner/:repo/git/:type
GET	/repos/:owner/:repo/git/refs
GET	/repos/:owner/:repo/git/refs/:ref
GET	/repos/:owner/:repo/git/refs/:ref
GET	/repos/:owner/:repo/git/commits/:sha
GET	/repos/:owner/:repo/git/trees/:sha
GET	/repos/:owner/:repo/git/blobs/:sha
```


#### `Uploads`
As a bonus, we expose an additional endpoint
```tsv
METHOD	ENDPOINT	Description
POST	/repos/:owner/:repo/upload
```

This pins uploads to a uniquely identified branch.  The result can
then be cloned for replication.

The semantics for working with this endpoint are the exact same as
normal browser file uploads.  As a bonus feature, if a header with
`content-md5` is sent, the
[checksum of the file is validated](https://github.com/mcavage/node-restify/blob/cc86da05e28dffd9304460c3851f4ac0f0153439/lib/plugins/body_reader.js#L89-L118)
before being saved.  For all cases, sha1 sums are provided for each
upload.

**Caveats** cloning is currently only possible when using fs bare
option (default).

##### Example
EG
```bash
+ curl -ivs -XPOST -H 'content-type: multipart/form-data' -F file=@../gist/sunder.gist/input.txt localhost:6776/repos/me/proof/upload
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> POST /repos/me/proof/upload HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> Content-Length: 773
> Expect: 100-continue
> content-type: multipart/form-data; boundary=----------------------------03e35a1f6c38
> 
< HTTP/1.1 100 Continue
} [data not shown]
< HTTP/1.1 201 Created
< Connection: close
< Content-Type: application/json
< Content-Length: 669
< Date: Wed, 25 Dec 2013 23:59:00 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 100 Continue

{
  "err": null,
  "body": [
    {
      "ref": "upload/incoming/2013-12-25-57540359/36ca88",
      "sha": "36ca88c51023c38b135b243fe054da98d3eb6ac5",
      "head": {
        "commit": "36ca88c51023c38b135b243fe054da98d3eb6ac5",
        "tree": {
          "tree": "1daf69f11ee1f5ff253e1a3300839cf6c7be710f",
          "author": {
            "name": "MY AUTHOR",
            "email": "git@js"
          },
          "committer": {
            "name": "MY COMMITTER",
            "email": "git@js"
          },
          "message": "MY JUSTIFICATION",
          "url": "http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f"
        },
        "url": "http://localhost:6776/repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5"
      },
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88"
    }
  ]
}
```
So each request like this creates a new set of blobs on a new uniquely
identified branch.

### Use API to fetch data
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/refs
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/refs HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 2452
< Date: Thu, 26 Dec 2013 00:05:36 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 2452
Date: Thu, 26 Dec 2013 00:05:36 GMT

{
  "err": null,
  "body": [
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51951039/722e28",
      "sha": "722e28bf2d3aa24cb3eae6b34c63a1bef0f2311a",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51951039/722e28"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51956598/cb3955",
      "sha": "cb3955e12f4b81c25ed307a6d196c0b5decc7883",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51956598/cb3955"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51959099/167675",
      "sha": "167675a1605d03d9eaa5448b432e250a86fccb39",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51959099/167675"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51961695/bf9c8e",
      "sha": "bf9c8ec01ef9f8926109f12e64c3b0a965c7e845",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51961695/bf9c8e"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51962813/4f9f5c",
      "sha": "4f9f5c47326c677fb91718c953b7d1dec21e7921",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51962813/4f9f5c"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-54381462/494606",
      "sha": "494606f961d5b519df094662365f52c539a3a142",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-54381462/494606"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57444767/09ae06",
      "sha": "09ae0668f6792d11a55fc050af494d04e6616e14",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57444767/09ae06"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57479601/9d8cd2",
      "sha": "9d8cd26166485fcbf63bd0667456a1ef94255a35",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57479601/9d8cd2"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57500649/127d5a",
      "sha": "127d5a329803597987a912788c260812ead21af7",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57500649/127d5a"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57521748/49a3c6",
      "sha": "49a3c6019a37aa4d6762236c58bf5a8cb78fda0a",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57521748/49a3c6"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57540359/36ca88",
      "sha": "36ca88c51023c38b135b243fe054da98d3eb6ac5",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88"
    }
  ],
  "url": "http://localhost:6776/repos/me/proof/git/refs/"
}
```
#### Get ref
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88 HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 184
< Date: Thu, 26 Dec 2013 00:00:56 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 184
Date: Thu, 26 Dec 2013 00:00:56 GMT

{
  "err": null,
  "body": {
    "type": "commit",
    "sha": "1daf69f11ee1f5ff253e1a3300839cf6c7be710f",
    "url": "http://localhost:6776/repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5"
  }
}
```
#### Get commit
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5 HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 402
< Date: Thu, 26 Dec 2013 00:01:44 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 402
Date: Thu, 26 Dec 2013 00:01:44 GMT

{
  "err": null,
  "body": {
    "type": "commit",
    "body": {
      "tree": "1daf69f11ee1f5ff253e1a3300839cf6c7be710f",
      "parents": [],
      "author": {
        "name": "MY AUTHOR",
        "email": "git@js",
        "date": "2013-12-25T23:59:00.000Z"
      },
      "committer": {
        "name": "MY COMMITTER",
        "email": "git@js",
        "date": "2013-12-25T23:59:00.000Z"
      },
      "message": "MY JUSTIFICATION"
    },
    "url": "http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f"
  }
}
```
#### Get tree
```bash
+ json -H
+ curl -ivs http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 291
< Date: Thu, 26 Dec 2013 00:02:02 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 291
Date: Thu, 26 Dec 2013 00:02:02 GMT

{
  "err": null,
  "body": {
    "input.txt": {
      "mode": 33188,
      "hash": "ca32e189ce9fc464583de225ae5170bc7b8bf776",
      "url": "http://localhost:6776/repos/me/proof/git/blobs/ca32e189ce9fc464583de225ae5170bc7b8bf776"
    }
  },
  "url": "http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f/"
}
```
#### Get blob
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/blobs/ca32e189ce9fc464583de225ae5170bc7b8bf776
+ json -H -C content
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/blobs/ca32e189ce9fc464583de225ae5170bc7b8bf776 HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 691
< Date: Thu, 26 Dec 2013 00:02:34 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 691
Date: Thu, 26 Dec 2013 00:02:34 GMT

2011-03-09T08:38:01	242
2013-05-08T14:43:02	89
2013-06-08T12:22:34	100
2013-06-08T11:28:39	143
2013-07-14T13:14:37	98
2011-03-08T21:34:27	126
2011-04-08T19:30:37	94
2011-04-08T18:29:12	91
2011-11-08T16:55:07	100
2011-11-08T16:21:07	84
2012-01-14T11:58:00	66
2012-01-14T09:44:39	94
2012-03-14T02:42:41	144
2012-05-14T01:54:29	204
2013-03-08T16:20:21	57
2013-03-08T14:43:02	89
2013-03-08T12:22:34	100
2013-03-08T11:28:39	143
2013-04-14T13:14:37	98
2013-05-14T11:58:00	66
2013-05-14T09:44:39	94
2013-05-14T02:42:41	144
2013-05-14T01:54:29	204
2013-07-14T11:58:00	66
2013-08-14T09:44:39	94

```


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
#### low level
* make options for lots of things so that user can tweak stream
  behavior
  * committer, refs, etc
  * make commit

#### high level
* get POST json api endpoints working
  * doublecheck API compatibility with github

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


### Inspecting a configured running instance

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
