from decimal import Decimal
from django.contrib.auth.models import User

def calculate_group_balances(group):
    """
    Computes net balances for all members of a group:
    Net Balance = Total Paid in Expenses + Total Received in Settlements - Total Owed in Splits - Total Paid in Settlements
    """
    members = group.members.all()
    net_balances = {member.id: Decimal('0.00') for member in members}

    # Add paid expenses and subtract split amounts
    for expense in group.expenses.all():
        net_balances[expense.payer.id] += expense.amount
        for split in expense.splits.all():
            net_balances[split.user.id] -= split.amount

    # Add settlements
    for settlement in group.settlements.all():
        # payer paid payee
        net_balances[settlement.payer.id] -= settlement.amount
        net_balances[settlement.payee.id] += settlement.amount

    return net_balances

def simplify_debts(net_balances, user_id_map):
    """
    net_balances: dict of {user_id: Decimal}
    user_id_map: dict of {user_id: User object}
    Returns a list of dicts: [
        {
            'from_user_id': int,
            'from_user': User,
            'to_user_id': int,
            'to_user': User,
            'amount': Decimal
        }
    ]
    """
    debtors = []
    creditors = []
    
    for uid, bal in net_balances.items():
        if bal < -Decimal('0.005'):
            debtors.append({'id': uid, 'balance': bal})
        elif bal > Decimal('0.005'):
            creditors.append({'id': uid, 'balance': bal})

    simplified_transactions = []

    while debtors and creditors:
        # Sort every iteration to greedily pick the largest remaining debtor and creditor
        debtors.sort(key=lambda x: x['balance'])  # Most negative first
        creditors.sort(key=lambda x: x['balance'], reverse=True)  # Most positive first

        d = debtors[0]
        c = creditors[0]

        debt_amount = abs(d['balance'])
        credit_amount = c['balance']

        amount = min(debt_amount, credit_amount)
        amount = amount.quantize(Decimal('0.01'))

        if amount > Decimal('0.00'):
            simplified_transactions.append({
                'from_user_id': d['id'],
                'from_user': user_id_map[d['id']],
                'to_user_id': c['id'],
                'to_user': user_id_map[c['id']],
                'amount': amount
            })

        # Update balances
        d['balance'] += amount
        c['balance'] -= amount

        # Remove if balance is settled
        if abs(d['balance']) < Decimal('0.005'):
            debtors.pop(0)
        if abs(c['balance']) < Decimal('0.005'):
            creditors.pop(0)

    return simplified_transactions

def calculate_splits(total_amount, members_ids, split_type, splits_data):
    """
    total_amount: Decimal or float/str representing the total amount
    members_ids: list of user IDs who participate in the split
    split_type: 'equal', 'unequal', 'percentage', 'shares'
    splits_data: list of dicts: [{'user_id': int, 'split_value': Decimal}]
                 For 'equal', splits_data can be empty.
    
    Returns a dict of {user_id: Decimal} representing how much each user owes.
    Raises ValueError if validation fails.
    """
    total_amount = Decimal(str(total_amount))
    if total_amount <= 0:
        raise ValueError("Total amount must be greater than zero.")
        
    if not members_ids:
        raise ValueError("Must have at least one member to split with.")

    result = {}
    splits_map = {item['user_id']: Decimal(str(item.get('split_value', 0) or 0)) for item in splits_data}

    if split_type == 'equal':
        n = Decimal(len(members_ids))
        base_share = (total_amount / n).quantize(Decimal('0.01'))
        result = {uid: base_share for uid in members_ids}
        
        # Handle rounding errors by allocating the remaining cents to the first member
        sum_shares = sum(result.values())
        diff = total_amount - sum_shares
        if diff != 0:
            result[members_ids[0]] += diff

    elif split_type == 'unequal':
        for uid in members_ids:
            if uid not in splits_map:
                raise ValueError(f"Missing split amount for user {uid}.")
        
        sum_shares = sum(splits_map[uid] for uid in members_ids)
        if abs(sum_shares - total_amount) > Decimal('0.01'):
            raise ValueError(f"Sum of custom splits ({sum_shares}) must equal the total amount ({total_amount}).")
        
        result = {uid: splits_map[uid].quantize(Decimal('0.01')) for uid in members_ids}
        sum_result = sum(result.values())
        diff = total_amount - sum_result
        if diff != 0:
            result[members_ids[0]] += diff

    elif split_type == 'percentage':
        for uid in members_ids:
            if uid not in splits_map:
                raise ValueError(f"Missing percentage for user {uid}.")
        
        sum_pct = sum(splits_map[uid] for uid in members_ids)
        if abs(sum_pct - Decimal('100.00')) > Decimal('0.01'):
            raise ValueError(f"Sum of percentages ({sum_pct}) must equal 100%.")

        result = {}
        for uid in members_ids:
            result[uid] = (total_amount * splits_map[uid] / Decimal('100.00')).quantize(Decimal('0.01'))
        
        sum_shares = sum(result.values())
        diff = total_amount - sum_shares
        if diff != 0:
            result[members_ids[0]] += diff

    elif split_type == 'shares':
        for uid in members_ids:
            if uid not in splits_map:
                raise ValueError(f"Missing share count for user {uid}.")
            if splits_map[uid] <= 0:
                raise ValueError(f"Shares count must be greater than zero for user {uid}.")

        total_shares = sum(splits_map[uid] for uid in members_ids)
        if total_shares <= 0:
            raise ValueError("Total shares must be greater than zero.")

        result = {}
        for uid in members_ids:
            result[uid] = (total_amount * splits_map[uid] / total_shares).quantize(Decimal('0.01'))

        sum_shares = sum(result.values())
        diff = total_amount - sum_shares
        if diff != 0:
            result[members_ids[0]] += diff
            
    else:
        raise ValueError(f"Invalid split type: {split_type}")

    return result
