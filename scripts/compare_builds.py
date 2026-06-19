"""
PoE2 .build file comparator.
Compares two poe.ninja .build JSON files and shows advantages/disadvantages.

Usage:
    python compare_builds.py build1.build build2.build
"""
import json
import sys
import re
from pathlib import Path
from collections import defaultdict

ASCENDANCY_NAMES = {
    "Witch2": "Blood Mage",
    "Witch1": "Infernalist",
    "Witch3": "Stormweaver",
    "Sorcerer1": "Stormweaver",
    "Sorcerer2": "Chronomancer",
    "Monk1": "Invoker",
    "Monk2": "Acolyte of Chayula",
    "Mercenary1": "Witchhunter",
    "Mercenary2": "Gemlin Legionnaire",
    "Mercenary3": "Tactician",
    "Warrior1": "Warbringer",
    "Warrior2": "Titan",
    "Warrior3": "Smith of Kitava",
    "Ranger1": "Deadeye",
    "Ranger2": "Pathfinder",
    "Huntress1": "Ritualist",
    "Huntress2": "Amazon",
}


def categorize_passive(node_id):
    if node_id.startswith("Ascendancy"):
        return "Ascendancy"
    if node_id.startswith("passive_keystone"):
        return "Keystone"
    if node_id.startswith("jewel_slot"):
        return "Jewel Socket"
    if node_id.startswith("witch_sorceress"):
        return "Witch/Sorceress"
    if node_id.startswith("criticals") or node_id.startswith("critical"):
        return "Critical"
    if node_id.startswith("spell_criticals") or node_id.startswith("spell_critical"):
        return "Spell Critical"
    if node_id.startswith("cast_speed"):
        return "Cast Speed"
    if node_id.startswith("spells") or node_id.startswith("spell"):
        return "Spell"
    if node_id.startswith("projectile_spells") or node_id.startswith("projectile_spell"):
        return "Projectile Spell"
    if node_id.startswith("area_spells") or node_id.startswith("area_attacks") or node_id.startswith("area"):
        return "Area"
    if node_id.startswith("elemental"):
        return "Elemental"
    if node_id.startswith("energy_shield"):
        return "Energy Shield"
    if node_id.startswith("intelligence"):
        return "Intelligence"
    if node_id.startswith("dexterity"):
        return "Dexterity"
    if node_id.startswith("strength"):
        return "Strength"
    if node_id.startswith("attributes"):
        return "Attributes"
    if node_id.startswith("duration"):
        return "Duration"
    return "Other"


def gem_short_name(gem_id):
    match = re.search(r'SkillGem([\w_]+)$', gem_id) or \
            re.search(r'SupportGem([\w_]+)$', gem_id) or \
            re.search(r'/([\w_]+)$', gem_id)
    name = match.group(1) if match else gem_id
    name = re.sub(r'(.)([A-Z])', r'\1 \2', name)
    name = re.sub(r'_', ' ', name)
    name = name.replace(' Two ', ' 2').strip()
    return name


def parse_build(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    build = {
        'name': data.get('name', 'Unnamed'),
        'author': data.get('author', 'Unknown'),
        'ascendancy': ASCENDANCY_NAMES.get(data.get('ascendancy', ''), data.get('ascendancy', 'Unknown')),
        'ascendancy_id': data.get('ascendancy', ''),
        'passives': [],
        'passives_by_category': defaultdict(list),
        'skills': [],
    }

    for p in data.get('passives', []):
        cat = categorize_passive(p['id'])
        entry = {'id': p['id'], 'weapon_set': p.get('weapon_set', 0), 'category': cat}
        build['passives'].append(entry)
        build['passives_by_category'][cat].append(entry)

    for s in data.get('skills', []):
        skill = {
            'id': s['id'],
            'name': gem_short_name(s['id']),
            'supports': [{'id': ss['id'], 'name': gem_short_name(ss['id'])} for ss in s.get('support_skills', [])]
        }
        build['skills'].append(skill)

    return build


def compare_builds(build_a, build_b):
    diff = {
        'buildA': {'name': build_a['name'], 'ascendancy': build_a['ascendancy'], 'author': build_a['author']},
        'buildB': {'name': build_b['name'], 'ascendancy': build_b['ascendancy'], 'author': build_b['author']},
        'passives': {'onlyA': [], 'onlyB': [], 'shared': []},
        'passives_by_category': defaultdict(lambda: {'onlyA': [], 'onlyB': [], 'shared': []}),
        'skills': {'onlyA': [], 'onlyB': [], 'shared': []},
    }

    passives_a = {p['id']: p for p in build_a['passives']}
    passives_b = {p['id']: p for p in build_b['passives']}

    all_categories = set()
    for p in build_a['passives']:
        all_categories.add(p['category'])
    for p in build_b['passives']:
        all_categories.add(p['category'])

    for cat in all_categories:
        for p in build_a['passives']:
            if p['category'] != cat:
                continue
            target = diff['passives']['shared'] if p['id'] in passives_b else diff['passives']['onlyA']
            target.append({'id': p['id'], 'weapon_set': p['weapon_set']})
            target_cat = diff['passives_by_category'][cat]['shared'] if p['id'] in passives_b else diff['passives_by_category'][cat]['onlyA']
            target_cat.append({'id': p['id'], 'weapon_set': p['weapon_set']})

        for p in build_b['passives']:
            if p['category'] != cat or p['id'] in passives_a:
                continue
            diff['passives']['onlyB'].append({'id': p['id'], 'weapon_set': p['weapon_set']})
            diff['passives_by_category'][cat]['onlyB'].append({'id': p['id'], 'weapon_set': p['weapon_set']})

    # Skills comparison
    skills_a = {}
    for s in build_a['skills']:
        key = re.search(r'/([\w_]+)$', s['id'])
        skills_a[key.group(1) if key else s['id']] = s

    skills_b = {}
    for s in build_b['skills']:
        key = re.search(r'/([\w_]+)$', s['id'])
        skills_b[key.group(1) if key else s['id']] = s

    for s in build_a['skills']:
        key = re.search(r'/([\w_]+)$', s['id'])
        key = key.group(1) if key else s['id']
        if key in skills_b:
            shared = {'name': s['name'], 'id': s['id'], 'supports': {'onlyA': [], 'onlyB': [], 'shared': []}}
            sup_a = {re.search(r'/([\w_]+)$', ss['id']).group(1) if re.search(r'/([\w_]+)$', ss['id']) else ss['id']: ss for ss in s['supports']}
            sup_b = {re.search(r'/([\w_]+)$', ss['id']).group(1) if re.search(r'/([\w_]+)$', ss['id']) else ss['id']: ss for ss in skills_b[key]['supports']}
            for ss in s['supports']:
                skey = re.search(r'/([\w_]+)$', ss['id'])
                skey = skey.group(1) if skey else ss['id']
                if skey in sup_b:
                    shared['supports']['shared'].append(ss['name'])
                else:
                    shared['supports']['onlyA'].append(ss['name'])
            for ss in skills_b[key]['supports']:
                skey = re.search(r'/([\w_]+)$', ss['id'])
                skey = skey.group(1) if skey else ss['id']
                if skey not in sup_a:
                    shared['supports']['onlyB'].append(ss['name'])
            diff['skills']['shared'].append(shared)
        else:
            diff['skills']['onlyA'].append(s)

    for s in build_b['skills']:
        key = re.search(r'/([\w_]+)$', s['id'])
        key = key.group(1) if key else s['id']
        if key not in skills_a:
            diff['skills']['onlyB'].append(s)

    diff['summary'] = {
        'total_passives_a': len(build_a['passives']),
        'total_passives_b': len(build_b['passives']),
        'shared_passives': len(diff['passives']['shared']),
        'unique_passives_a': len(diff['passives']['onlyA']),
        'unique_passives_b': len(diff['passives']['onlyB']),
        'total_skills_a': len(build_a['skills']),
        'total_skills_b': len(build_b['skills']),
        'shared_skills': len(diff['skills']['shared']),
        'unique_skills_a': len(diff['skills']['onlyA']),
        'unique_skills_b': len(diff['skills']['onlyB']),
    }

    return diff


def print_diff(diff):
    s = diff['summary']
    print()
    print("=" * 60)
    print("  BUILD COMPARISON")
    print("=" * 60)
    print()
    print(f"  Build A: {diff['buildA']['name']} ({diff['buildA']['ascendancy']})")
    print(f"  Build B: {diff['buildB']['name']} ({diff['buildB']['ascendancy']})")
    print()
    print(f"  {'─' * 56}")
    print(f"  {'SUMMARY':^56}")
    print(f"  {'─' * 56}")
    print(f"  {'':20} {'A':>8} {'B':>8} {'Shared':>8} {'Unique A':>8} {'Unique B':>8}")
    print(f"  {'Passives':20} {s['total_passives_a']:>8} {s['total_passives_b']:>8} {s['shared_passives']:>8} {s['unique_passives_a']:>8} {s['unique_passives_b']:>8}")
    print(f"  {'Skills':20} {s['total_skills_a']:>8} {s['total_skills_b']:>8} {s['shared_skills']:>8} {s['unique_skills_a']:>8} {s['unique_skills_b']:>8}")
    print()

    if s['shared_passives'] > 0:
        print(f"  SHARED PASSIVES ({s['shared_passives']})")
        for p in diff['passives']['shared']:
            ws = f" (WS{p['weapon_set']})" if p['weapon_set'] > 0 else ""
            print(f"    {p['id']}{ws}")
        print()

    def print_passive_section(items, label):
        if not items:
            return
        by_cat = defaultdict(list)
        for p in items:
            by_cat[categorize_passive(p['id'])].append(p)
        print(f"  {label}")
        for cat in sorted(by_cat.keys()):
            print(f"    [{cat}]")
            for p in by_cat[cat]:
                ws = f" (WS{p['weapon_set']})" if p['weapon_set'] > 0 else ""
                print(f"      {p['id']}{ws}")
        print()

    print_passive_section(diff['passives']['onlyA'], f"UNIQUE TO BUILD A ({diff['buildA']['name']})")
    print_passive_section(diff['passives']['onlyB'], f"UNIQUE TO BUILD B ({diff['buildB']['name']})")

    if s['shared_skills'] > 0:
        print(f"  SHARED SKILLS ({s['shared_skills']})")
        for sk in diff['skills']['shared']:
            print(f"    {sk['name']}")
            sup = sk['supports']
            if sup['shared']:
                print(f"      Supports: {', '.join(sup['shared'])}")
            if sup['onlyA']:
                print(f"      Only in A: {', '.join(sup['onlyA'])}")
            if sup['onlyB']:
                print(f"      Only in B: {', '.join(sup['onlyB'])}")
        print()

    def print_skill_section(items, label):
        if not items:
            return
        print(f"  {label}")
        for sk in items:
            print(f"    {sk['name']}")
            if sk.get('supports'):
                names = [ss['name'] for ss in sk['supports']]
                print(f"      Supports: {', '.join(names)}")
        print()

    print_skill_section(diff['skills']['onlyA'], f"SKILLS ONLY IN BUILD A ({diff['buildA']['name']})")
    print_skill_section(diff['skills']['onlyB'], f"SKILLS ONLY IN BUILD B ({diff['buildB']['name']})")


def main():
    if len(sys.argv) != 3:
        print("Usage: python compare_builds.py <build1.build> <build2.build>")
        sys.exit(1)

    try:
        build_a = parse_build(sys.argv[1])
        build_b = parse_build(sys.argv[2])
        diff = compare_builds(build_a, build_b)
        print_diff(diff)
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
