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
const extractToken = require('../lib/setupIT').extractToken;
const expect = chai.expect;
const OAUTH_TOKEN_NAME = require('../../src/common/constants').OAUTH_TOKEN_NAME;
chai.use(chaiHttp);


describe('commercetools language parser', function () {

    describe('Integration tests', function () {

        // Get environment
        let env = setup();

        // Increase test timeout
        this.slow(env.slow);
        this.timeout(env.timeout);

        let cartId;
        let accessToken;

        const productVariantId = '90ed1673-4553-47c6-9336-5cb23947abb2-1';

        /** Create cart. */
        beforeEach(function () {
            return chai.request(env.openwhiskEndpoint)
                .post(env.cartsPackage + 'postCartEntry')
                .query({
                    currency: 'USD',
                    quantity: 1,
                    productVariantId: productVariantId
                })
                .then(function (res) {
                    expect(res).to.be.json;
                    expect(res).to.have.status(HttpStatus.CREATED);

                    // Store cart id
                    cartId = res.body.id;
                    // Store token to access the anonymous session
                    accessToken = extractToken(res);
                });
        });


        it('respects the Accept-Language header if present', function () {
            const args = {
                id: cartId,
                code: 'HW35'
            };
            return chai.request(env.openwhiskEndpoint)
                .post(env.cartsPackage + 'postCoupon')
                .query(args)
                .set('Accept-Language', 'de-DE')
                .set('cookie', `${OAUTH_TOKEN_NAME}=${accessToken};`)
                .then(function(res) {
                    expect(res).to.be.json;
                    expect(res).to.have.status(HttpStatus.OK);
                    requiredFields.verifyCart(res.body);
                    expect(res.body).to.have.property('coupons');
                    expect(res.body.coupons).to.have.lengthOf(1);

                    let coupon = res.body.coupons[0];
                    requiredFields.verifyCoupon(coupon);
                    expect(coupon).to.have.property('description');
                    expect(coupon).to.have.property('description').equal('Deutsche beschreibung')
                });
        });

        it('uses the default Accept-Language when it is missing from the request', function () {
            const args = {
                id: cartId,
                code: 'HW35'
            };
            return chai.request(env.openwhiskEndpoint)
                .post(env.cartsPackage + 'postCoupon')
                .query(args)
                .set('cookie', `${OAUTH_TOKEN_NAME}=${accessToken};`)
                .then(function(res) {
                    expect(res).to.be.json;
                    expect(res).to.have.status(HttpStatus.OK);
                    requiredFields.verifyCart(res.body);
                    expect(res.body).to.have.property('coupons');
                    expect(res.body.coupons).to.have.lengthOf(1);

                    let coupon = res.body.coupons[0];
                    requiredFields.verifyCoupon(coupon);
                    expect(coupon).to.have.property('description');
                    expect(coupon).to.have.property('description').equal('This is a sample description')
                });
        });
    });
});