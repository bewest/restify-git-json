
BLANKET=--require blanket 
SHOULD=--require should

clean:
	mkdir -p out
	rm -Rf out/foobar/
	rm -Rf out/testUser/
	rm -Rf out/fooTestUser/
	rm -f /tmp/test-restify-git-json.sock

travis-cov:
	NODE_ENV=test node_modules/.bin/mocha  ${BLANKET} ${SHOULD} -R 'travis-cov' ./test/test*.js

coveralls:
	NODE_ENV=test \
	./node_modules/.bin/mocha ${BLANKET} ${SHOULD}  -R mocha-lcov-reporter \
    test/test*.js | ./coverall.sh

coverhtml:
	./node_modules/.bin/mocha ${BLANKET} ${SHOULD}  -R html-cov test/*.js > test/coverage.html

precover:
	./node_modules/.bin/mocha ${BLANKET} ${SHOULD} -R html-cov test/*.js | w3m -T text/html

test:
	mocha --verbose --require should -R tap test/*.js

travis: test travis-cov coveralls coverhtml

.PHONY: test
