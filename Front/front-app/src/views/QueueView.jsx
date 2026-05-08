import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import Card from '../components/Card';

function flattenOutstanding(recipientExpirations = {}) {
	return Object.entries(recipientExpirations)
		.flatMap(([recipientId, claims]) =>
			Object.entries(claims || {}).map(([claimId, expiresAt]) => ({
				recipientId,
				claimId,
				expiresAt,
			}))
		)
		.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
}

export default function QueueView({ resource, onBack }) {
	const outstandingTickets = flattenOutstanding(resource.recipientExpirations);

	return (
		<div className="space-y-6">
			<button
				onClick={onBack}
				className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
			>
				<ArrowLeft size={18} /> Back to Resources
			</button>

			<div>
				<h2 className="text-2xl font-bold text-slate-800">
					{resource.name} Outstanding Tickets
				</h2>
				<p className="text-slate-500">
					{outstandingTickets.length} tickets still pending redemption
				</p>
			</div>

			<Card>
				<div className="p-6 space-y-3">
					{outstandingTickets.length === 0 ? (
						<div className="text-slate-500">No outstanding tickets for this batch.</div>
					) : (
						outstandingTickets.map((ticket, index) => (
							<div
								key={ticket.claimId}
								className="flex items-center justify-between border-b pb-3 last:border-none"
							>
								<div>
									<div className="font-medium text-slate-800">
										#{index + 1} Recipient {ticket.recipientId.slice(-6).toUpperCase()}
									</div>
									<div className="text-sm text-slate-500">
										Claim {ticket.claimId.slice(-6).toUpperCase()}
									</div>
								</div>

								<div className="text-right">
									<div className="flex items-center gap-2 text-sm text-slate-700 justify-end">
										<Clock size={14} />
										{ticket.expiresAt.toLocaleString()}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</Card>
		</div>
	);
}