---
title: "Types of Load Balancers"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "hardware", "software", "cloud"]
excerpt: "Learn the different types of load balancers — hardware vs software, DNS-based vs reverse proxy — and when each type is the right choice."
---

# Types of Load Balancers

Not all load balancers are created equal. A hardware appliance costs $100K. An Nginx config costs nothing. AWS ALB costs per request. Understanding the types helps you pick the right one for your scale and budget.

## Categories of Load Balancers

### Hardware Load Balancers

Physical appliances dedicated to load balancing.

```text
Examples: F5 BIG-IP, Citrix ADC, Cisco ACE

Pros:
  - Extremely high performance (millions of requests/second)
  - Built-in DDoS protection
  - Hardware SSL acceleration

Cons:
  - Expensive ($50K-$200K+)
  - Fixed capacity (can't scale elastically)
  - Vendor lock-in, specialized knowledge needed

Best for: Large enterprises, financial institutions, government
```

### Software Load Balancers

Software running on commodity hardware.

```text
Examples: Nginx, HAProxy, Envoy, Traefik

Pros:
  - Free (open source) or low cost
  - Flexible configuration
  - Runs on any hardware or cloud VM
  - Easy to automate and version control

Cons:
  - Performance limited by host hardware
  - Requires more operational knowledge

Best for: Most web applications, APIs, microservices
```

### Cloud Load Balancers

Managed services provided by cloud platforms.

```text
Examples: AWS ALB/NLB, Google Cloud Load Balancing, Azure Load Balancer

Pros:
  - Fully managed (no servers to maintain)
  - Auto-scaling (handles any traffic level)
  - Integrated with cloud services (auto-discovery, health checks)
  - Pay-per-use pricing

Cons:
  - Cloud vendor lock-in
  - Less configurable than self-hosted
  - Ongoing cost based on traffic

Best for: Cloud-native applications, startups, teams without infrastructure expertise
```

### DNS-Based Load Balancing

Distribute traffic at the DNS level before it reaches your infrastructure.

```text
How it works:
  User requests myapp.com
  DNS returns different IPs based on:
    - Geographic location (nearest server)
    - Random selection (round robin)
    - Server health (remove unhealthy IPs)

Examples: Route 53, Cloudflare DNS, Google Cloud DNS

Pros: Works before traffic reaches your network, geographic routing
Cons: Limited control, DNS caching delays changes
```

## Comparison

| Type | Cost | Performance | Flexibility | Best For |
|---|---|---|---|---|
| **Hardware** | Very high | Very high | Low | Enterprise |
| **Software** | Low | High | Very high | Most applications |
| **Cloud** | Pay-per-use | Elastic | Medium | Cloud-native |
| **DNS-based** | Low | Global | Low | Geographic routing |

## Key Points Cheat Sheet

| Type | Best For | Examples |
|---|---|---|
| **Hardware** | Enterprise, extreme performance | F5, Citrix |
| **Software** | Most apps, full control | Nginx, HAProxy, Envoy |
| **Cloud** | Managed, auto-scaling | AWS ALB, GCP LB |
| **DNS-based** | Geographic routing, global traffic | Route 53, Cloudflare |

**Start with software (Nginx/HAProxy). Move to cloud-managed when you don't want to maintain infrastructure. Consider hardware only at extreme scale or compliance requirements.**
