#!/bin/bash

curl  http://localhost:3010 --request POST  --data '{"foo": "bar"}' --header "Content-Type: application/json"
