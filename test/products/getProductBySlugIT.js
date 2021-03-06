/*******************************************************************************
 *
 *    Copyright 2018 Adobe. All rights reserved.
 *    This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License. You may obtain a copy
 *    of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software distributed under
 *    the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *    OF ANY KIND, either express or implied. See the License for the specific language
 *    governing permissions and limitations under the License.
 *
 ******************************************************************************/

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const HttpStatus = require('http-status-codes');
const setup = require('../lib/setupIT.js').setup;
const requiredFields = require('../lib/requiredFields');
const expect = chai.expect;
chai.use(chaiHttp);

describe('commercetools getProductBySlug', function() {

    describe('Integration tests', function() {

        let env = setup();

        // Increase test timeout
        this.slow(env.slow);
        this.timeout(env.timeout);

        it('returns a product for a valid product slug', () => {
            return chai.request(env.openwhiskEndpoint)
                .get(env.productsPackage + 'getProductBySlug')
                .query({slug: 'meskwielt'})
                .set('Accept-Language', 'en')
                .set('Cache-Control', 'no-cache')
                .then(function (res) {
                    expect(res).to.be.json;
                    expect(res).to.have.status(HttpStatus.OK);

                    // Verify structure
                    requiredFields.verifyProduct(res.body);
                    expect(res.body.name).to.equal('El Gordo Down Jacket');
                    expect(res.body.slug).to.equal('meskwielt');
                });
        });

        it('returns a 404 error for a non existent product', function() {
            return chai.request(env.openwhiskEndpoint)
                .get(env.productsPackage + 'getProductBySlug')
                .set('Accept-Language', 'en')
                .set('Cache-Control', 'no-cache')
                .query({slug: 'does-not-exist'})
                .then(function(res) {
                    expect(res).to.have.status(HttpStatus.NOT_FOUND);
                    expect(res).to.be.json;
                    requiredFields.verifyErrorResponse(res.body);
                });
        });

        it('returns a 400 error when the slug parameter is missing', function() {
            return chai.request(env.openwhiskEndpoint)
                .get(env.productsPackage + 'getProductBySlug')
                .set('Accept-Language', 'en')
                .set('Cache-Control', 'no-cache')
                .then(function(res) {
                    expect(res).to.have.status(HttpStatus.BAD_REQUEST);
                    expect(res).to.be.json;
                    requiredFields.verifyErrorResponse(res.body);
                });
        });
    });
});