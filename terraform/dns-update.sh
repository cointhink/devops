cat dns.key | while read keyline
do
 box=`echo $keyline | cut -d' ' -f1`
 domain=`echo $keyline | cut -d' ' -f2`
 key=`echo $keyline | cut -d' ' -f3`
 ip=`jq '.modules[] | .resources."vultr_server.'$box'".primary.attributes.ipv4_address' terraform.tfstate | cut -d'"' -f2`
 ip6=`jq '.modules[] | .resources."vultr_server.'$box'".primary.attributes.ipv6_address' terraform.tfstate | cut -d'"' -f2`
 echo curl -s -4 "http://$domain:$key@dyn.dns.he.net/nic/update?hostname=$domain&myip=$ip&myipv6=$ip6"
 /usr/bin/curl -s -4 "http://$domain:$key@dyn.dns.he.net/nic/update?hostname=$domain&myip=$ip&myipv6=$ip6"
 echo
done

