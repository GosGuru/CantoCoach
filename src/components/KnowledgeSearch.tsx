import { useMemo, useState } from "react";
import { Search, BookOpen, Tag } from "lucide-react";
import { searchKnowledge } from "../data/knowledgeBase";

export function KnowledgeSearch() {
	const [query, setQuery] = useState("");
	const results = useMemo(() => searchKnowledge(query), [query]);

	return (
		<section className="glass-panel rounded-2xl p-5 sm:p-6">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
					<BookOpen className="w-5 h-5 text-accent" aria-hidden="true" />
				</div>
				<div>
					<h2 className="section-title">Sección de Ciencia</h2>
					<p className="text-xs text-text-subtle">
						Buscá conceptos de anatomía y técnica vocal.
					</p>
				</div>
			</div>

			<div className="relative">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar anatomía, twang, constricción, passaggio..."
					className="input-field pl-10"
					aria-label="Buscar en la base de conocimiento"
				/>
				<Search
					className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle"
					aria-hidden="true"
				/>
			</div>

			<div className="mt-4 space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
				{results.length === 0 ? (
					<div className="text-center py-6">
						<p className="text-sm text-text-muted">
							No encontré entradas para “{query}”. Probá con términos como
							“velo”, “twang” o “constricción”.
						</p>
					</div>
				) : (
					results.map((entry) => (
						<article
							key={entry.id}
							className="group p-4 rounded-xl bg-surface/60 border border-border hover:border-accent/30 hover:bg-surface transition-all"
						>
							<div className="flex items-start justify-between gap-3">
								<h3 className="text-sm font-semibold text-text group-hover:text-accent transition-colors">
									{entry.title}
								</h3>
								<span className="text-[10px] uppercase tracking-wider text-text-subtle bg-surface px-2 py-1 rounded-md border border-border shrink-0">
									{entry.category}
								</span>
							</div>
							<p className="text-sm text-text-muted mt-2 leading-relaxed">
								{entry.summary}
							</p>
							<div className="flex flex-wrap items-center gap-2 mt-3">
								<Tag className="w-3 h-3 text-text-subtle" aria-hidden="true" />
								{entry.tags.map((tag) => (
									<span
										key={tag}
										className="text-[10px] px-2 py-1 rounded-md bg-elevated/60 text-text-muted border border-border"
									>
										{tag}
									</span>
								))}
							</div>
						</article>
					))
				)}
			</div>
		</section>
	);
}
