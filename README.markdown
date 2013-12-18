
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

Work in progress.

## Install
```bash
$ npm install
```

## TODO

Many to most things, sorry.
#### high level
* make selection of git db backend selectable
* get json api working
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
* move git db selection to config/support
* make options for lots of things so that user can tweak stream
  behavior
  * committer, refs, etc


