document.getElementById('update-subnets').addEventListener('click', function() {
    const subnetCount = document.getElementById('subnet-count').value;
    const subnetDetails = document.getElementById('subnet-details');

    subnetDetails.innerHTML = '';

    for (let i = 0; i < subnetCount; i++) {
        const subnetDiv = document.createElement('div');
        subnetDiv.classList.add('subnet');

        const nameLabel = document.createElement('label');
        nameLabel.textContent = `Nome da Sub-rede ${i + 1}:`;
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.classList.add('subnet-name');

        const hostsLabel = document.createElement('label');
        hostsLabel.textContent = `Número de Hosts ${i + 1}:`;
        const hostsInput = document.createElement('input');
        hostsInput.type = 'number';
        hostsInput.classList.add('subnet-hosts');

        subnetDiv.appendChild(nameLabel);
        subnetDiv.appendChild(nameInput);
        subnetDiv.appendChild(hostsLabel);
        subnetDiv.appendChild(hostsInput);

        subnetDetails.appendChild(subnetDiv);
    }
});

document.getElementById('vslm-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const networkAddress = document.getElementById('network-address').value;
    const subnetCount = document.getElementById('subnet-count').value;
    const subnetNames = document.querySelectorAll('.subnet-name');
    const subnetHosts = document.querySelectorAll('.subnet-hosts');

    const subnets = [];
    for (let i = 0; i < subnetCount; i++) {
        subnets.push({
            name: subnetNames[i].value,
            hosts: parseInt(subnetHosts[i].value)
        });
    }

    calculateSubnets(networkAddress, subnets);
});

document.getElementById('clear-results').addEventListener('click', function() {
    document.getElementById('results').innerHTML = '';
    document.getElementById('network-address').value = '';
    document.getElementById('subnet-count').value = '';
    document.getElementById('subnet-details').innerHTML = '';
});

function calculateSubnets(networkAddress, subnets) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // Parse the network address and prefix
    const [network, prefix] = networkAddress.split('/');
    const prefixInt = parseInt(prefix);
    const totalHosts = Math.pow(2, 32 - prefixInt) - 2;

    let totalHostsNeeded = 0;
    subnets.forEach(subnet => {
        totalHostsNeeded += subnet.hosts;
    });

    if (totalHostsNeeded > totalHosts) {
        resultsDiv.innerHTML = 'Erro: O número total de hosts necessários excede o número de hosts disponíveis na rede.';
        return;
    }

    let resultText = `A rede ${networkAddress} possui ${totalHosts} hosts.<br>`;
    resultText += `Suas sub-redes precisam de ${totalHostsNeeded} hosts.<br>`;

    resultsDiv.innerHTML = resultText;

    let currentNetwork = ipToDecimal(network);
    let currentPrefix = prefixInt;

    subnets.sort((a, b) => b.hosts - a.hosts);

    subnets.forEach(subnet => {
        const hostsNeeded = subnet.hosts;
        const newPrefix = 32 - Math.ceil(Math.log2(hostsNeeded + 2));
        const hostsAvailable = Math.pow(2, 32 - newPrefix) - 2;
        const unusedHosts = hostsAvailable - hostsNeeded;

        const subnetData = {
            networkAddress: decimalToIp(currentNetwork),
            subnetMaskLength: newPrefix,
            subnetMask: prefixToSubnetMask(newPrefix),
            hostsAvailable: hostsAvailable,
            unusedHosts: unusedHosts,
            firstUsableAddress: decimalToIp(currentNetwork + 1),
            lastUsableAddress: decimalToIp(currentNetwork + hostsAvailable),
            broadcastAddress: decimalToIp(currentNetwork + hostsAvailable + 1),
            wildcardMask: prefixToWildcardMask(newPrefix)
        };

        const subnetResult = `
            <h3>${subnet.name}</h3>
            <p>Hosts Needed: ${hostsNeeded}</p>
            <p>Hosts Available: ${subnetData.hostsAvailable}</p>
            <p>Unused Hosts: ${subnetData.unusedHosts}</p>
            <p>Network Address: ${subnetData.networkAddress}</p>
            <p>Slash: ${subnetData.subnetMaskLength}</p>
            <p>Mask: ${subnetData.subnetMask}</p>
            <p>Usable Range: ${subnetData.firstUsableAddress} - ${subnetData.lastUsableAddress}</p>
            <p>Broadcast: ${subnetData.broadcastAddress}</p>
            <p>Wildcard: ${subnetData.wildcardMask}</p>
        `;
        
        resultsDiv.innerHTML += subnetResult;

        currentNetwork += hostsAvailable + 2;
    });
}

function ipToDecimal(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function decimalToIp(decimal) {
    return [
        (decimal >>> 24) & 255,
        (decimal >>> 16) & 255,
        (decimal >>> 8) & 255,
        decimal & 255
    ].join('.');
}

function prefixToSubnetMask(prefix) {
    return decimalToIp(~((1 << (32 - prefix)) - 1));
}

function prefixToWildcardMask(prefix) {
    return decimalToIp((1 << (32 - prefix)) - 1);
}
